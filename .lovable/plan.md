# SMS manuels de rendez-vous via Brevo — Phase 2 (conception détaillée)

## Objectif

Permettre au moniteur, depuis « Gestion des journées », d'envoyer manuellement un SMS de rendez-vous (spot + horaire) aux inscrits d'un groupe ou d'une journée, via l'API SMS transactionnels de Brevo. Jamais d'envoi automatique : prévisualisation puis confirmation explicite. Aperçu uniquement, aucune publication ni SMS réel.

## 1. Schéma SQL proposé (une migration)

Table `public.sms_send_log` :

```text
id              uuid PK default gen_random_uuid()
kind            text NOT NULL default 'appointment'
status          text NOT NULL default 'prepared'
                -- prepared | sending | sent | failed | unknown
date            date NOT NULL
activity        activity_type NOT NULL
daily_group_id  uuid NULL REFERENCES daily_groups(id)
reservation_id  uuid NULL          -- référence, pas de numéro dupliqué
recipient_name  text NULL          -- initiales ou prénom, affichage historique
phone_last4     text NULL          -- 4 derniers chiffres seulement
message         text NOT NULL      -- contenu exact envoyé (spot/horaire, pas de PII)
dedupe_key      text NOT NULL      -- sha256(date|group|reservation|message)
message_id      text NULL          -- identifiant Brevo
is_resend       boolean NOT NULL default false
error           text NULL
sent_by         uuid NULL
sent_by_email   text NULL
created_at      timestamptz NOT NULL default now()
updated_at      timestamptz NOT NULL default now()
```

- Index unique partiel : `UNIQUE (dedupe_key) WHERE is_resend = false` → bloque le doublon du même message, y compris clics répétés et requêtes concurrentes (un seul INSERT gagne).
- Grants : `SELECT, INSERT, UPDATE` à `authenticated`, `ALL` à `service_role`.
- RLS : lecture et écriture réservées aux admins via `public.has_role(auth.uid(), 'admin')` (mécanisme existant).
- Aucun numéro complet stocké : le téléphone reste dans `reservations`/`daily_waitlist`, le journal garde une référence + 4 chiffres.

## 2. Règles d'idempotence et états

- `dedupe_key` = hash(date, groupe, réservation, contenu du message).
- Même message déjà envoyé (`sent`/`unknown`) → renvoi bloqué par défaut ; un renvoi manuel explicite (`is_resend = true`, confirmé par le moniteur) est autorisé et journalisé.
- Modification du spot ou de l'horaire → contenu différent → nouveau `dedupe_key` → nouvel envoi autorisé ; l'historique conserve les deux notifications.
- Cycle : `prepared` (ligne créée avant appel) → `sending` → `sent` (Brevo a accepté, message_id reçu) ; `failed` (refus explicite Brevo) ; `unknown` (timeout/réponse incertaine) → **jamais de renvoi automatique** depuis `unknown`, seul un renvoi manuel est possible.
- `delivered` est prévu dans la liste d'états mais non alimenté dans cette phase (pas de webhook Brevo) ; il sera activé plus tard si souhaité.

## 3. Fonction serveur `send-appointment-sms`

- Authentification : session utilisateur + `has_role(..., 'admin')` (réutilisation du mécanisme existant des fonctions admin) ; CORS via `npm:@supabase/supabase-js@2/cors`.
- Validation Zod : date, activité, groupe, liste de destinataires (réservation + téléphone), message (1–459 caractères), indicateur de renvoi.
- Normalisation des numéros français : `06/07XXXXXXXX` → `+336/7XXXXXXXX` ; rejet des formats invalides avec message français.
- Pré-contrôles avant tout appel d'envoi : présence de `BREVO_API_KEY`, expéditeur SMS configuré, et lecture du solde de crédits SMS du compte Brevo (échec de ces contrôles = refus explicite, rien n'est envoyé).
- Appel Brevo : `POST https://api.brevo.com/v3/transactionalSMS/send` avec la clé existante (cohérent avec `sync-brevo-contacts`).
- Gestion des erreurs : réponse 2xx avec `messageId` → `sent` ; refus Brevo (4xx/5xx lisible) → `failed` + motif ; timeout/exception après émission possible → `unknown` (aucune nouvelle tentative automatique).
- Journalisation de chaque tentative dans `sms_send_log` ; erreurs renvoyées au client en français.

## 4. Interface admin (couches existantes)

- `src/services/sms.service.ts` : appels via le transport partagé (`api.ts`), aucun accès Supabase direct ailleurs.
- `src/hooks/admin/useAdminSms.ts` : préparation (destinataires d'un groupe avec téléphone non vide), envoi confirmé, historique.
- `src/components/admin/journees/AppointmentSmsDialog.tsx` : prévisualisation des destinataires, du contenu et des informations confirmées (date, activité, spot, horaire), zone de message modifiable, bouton de confirmation explicite, affichage des états par destinataire.
- `src/pages/AdminJournees.tsx` : ajout d'un bouton « SMS rendez-vous » par groupe (et par journée), ouvrant le dialogue. Aucune autre logique de la page modifiée.

## 5. Fichiers concernés

| Fichier | Action |
|---|---|
| migration `create_sms_send_log` | création (via outil de migration) |
| `supabase/functions/send-appointment-sms/index.ts` | création |
| `supabase/functions/send-appointment-sms/index_test.ts` | création |
| `src/services/sms.service.ts` | création |
| `src/hooks/admin/useAdminSms.ts` | création |
| `src/components/admin/journees/AppointmentSmsDialog.tsx` | création |
| `src/pages/AdminJournees.tsx` | ajout du bouton uniquement |
| `src/integrations/supabase/types.ts` | régénéré automatiquement |

## 6. Tests prévus (mocks uniquement, aucun SMS réel)

Tests Deno de la fonction avec Brevo simulé :
1. Refus si non connecté ou non admin.
2. Refus de validation (message vide, numéro invalide).
3. Envoi nominal : état `sent`, `message_id` enregistré, numéro normalisé `+33`.
4. Doublon : deuxième envoi du même message refusé (clé d'idempotence).
5. Renvoi manuel explicite autorisé et marqué `is_resend`.
6. Nouveau contenu (spot/horaire modifié) = nouvel envoi autorisé, historique conservé.
7. Refus Brevo explicite → `failed`, motif conservé.
8. Réponse incertaine/timeout → `unknown`, aucune relance automatique.
9. Pré-contrôles : clé absente ou crédits insuffisants → refus avant envoi.
10. Concurrence : deux requêtes simultanées du même message → un seul envoi.

## 7. Garanties

- Aucune logique de réservation, paiement Stripe, forfait, capacité ou météo modifiée ; lots F-27/F-28 intacts.
- Aucun SMS réel, aucune publication, aucun déploiement production sans autorisation explicite.
- Rapport final : commits HEAD avant/après, diff, résultats des tests, confirmation qu'aucun SMS réel n'a été envoyé.
