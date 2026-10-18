# Correction critique — paiement Stripe sans réservation confirmée

Environnement d'aperçu uniquement. Aucun déploiement, aucune publication, aucun paiement/e-mail réel.

## 1. Webhook à la carte (`stripe-webhook/index.ts`)

- `createReservationFromCheckout` retourne désormais un résultat explicite : `booked` (avec reservation_id), `refused` (motif), `indeterminate` (erreur réseau/interruption).
- Le flux principal n'exécute la suite (forfait, e-mails) **que si `booked`** :
  - `refused` → aucun forfait actif, aucune confirmation client ; incident enregistré (voir §2) ; événement marqué `failed`.
  - `indeterminate` → aucun forfait, aucune confirmation ; incident enregistré ; **l'événement n'est pas marqué `processed`** et la fonction répond 500 pour que Stripe retente la livraison (reprise sûre, déduplication par clés déterministes déjà en place).
- Un `reservation_id` est revérifié en base avant l'envoi de la confirmation client.
- Clés d'e-mails déterministes passées de `event.id` à `session.id` : deux événements distincts pour le même paiement ne produisent pas deux confirmations (les écritures restent protégées par les contraintes uniques existantes).

## 2. Incident durable — SANS nouvelle table

Le stockage durable utilise la table existante `admin_notifications` (déjà persistée, consultable dans l'admin) avec `p_kind = 'paid_booking_failed'` et `p_ref_key = session.id` (unique → rejeu idempotent). Métadonnées enrichies : référence Stripe, montant réel encaissé et devise (`amount_total`, `currency`), activité, date, participants, nom, e-mail, téléphone, motif. Aucune donnée de carte bancaire (jamais reçue par le webhook).
- Si l'enregistrement de l'incident échoue : réponse 500, événement non marqué, Stripe retente → reprise idempotente.
- E-mail d'alerte admin conservé en complément (jamais seul canal).
- Le client reçoit un e-mail honnête : « paiement reçu, réservation non confirmée, notre équipe régularise » (modèle séparé, clé déterministe par session).

## 3. Stage 100 % Glisse (`stripe-webhook/stage.ts`)

- Inchangé fonctionnellement : transaction atomique des 5 jours préservée, aucune écriture partielle en cas de refus.
- Ajout : enrichissement des métadonnées de l'incident existant (nom, téléphone) et envoi au client du même e-mail honnête « paiement reçu, réservation non confirmée ». Aucune règle métier du stage modifiée.

## 4. Page de retour Stripe — migration à valider

Pour vérifier côté serveur l'état réel, une **nouvelle fonction SQL en lecture seule** est nécessaire :

```text
get_payment_booking_status(p_stripe_session_id text)
RETURNS 'confirmed' | 'pending' | 'failed' | 'unknown'
```

- Lecture seule sur `reservations`, `client_packages` et `admin_notifications` ; aucun droit nouveau au-delà du GRANT EXECUTE à anon/authenticated (même niveau que les fonctions de réservation publiques existantes).
- `ReservationConfirmee.tsx` appelle cette fonction et affiche l'un des trois états exacts du cahier : « Réservation confirmée », « Paiement reçu, réservation en cours de vérification », « Paiement reçu, réservation non confirmée. Notre équipe doit régulariser la situation ».

## 5. Tests (obligatoires, aucun appel réel)

Les 10 scénarios du cahier en tests Deno simulés (mocks Stripe/Supabase), plus les tests existants du webhook (régression) : refus après paiement, incident durable, échec d'e-mail d'alerte, interruption après réclamation, rejeu identique, événements distincts même paiement, résultat indéterminé, stage refusé au 5e jour, page de retour sans réservation, parcours nominal.

## Limites respectées

Pas de remboursement automatique, pas de modification du plafond de 3 groupes, pas de modification des données historiques, périmètre limité au webhook, au modèle d'e-mail d'incident, à la page de retour et à la fonction de lecture ci-dessus.
