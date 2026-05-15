
# Système de réservation par crédits — Kitesurf Passion

## Objectif

Après paiement de l'acompte, le client reçoit un **identifiant de réservation unique** (ex. `KP-2026-XXXX`) qui lui sert de "passe" pour réserver librement ses journées dans le calendrier, selon ses crédits restants et la météo.

---

## 1. Modèle de données (Lovable Cloud)

Nouvelles tables :

- **`client_packages`** — un pack acheté par un client
  - `package_code` (TEXT unique, ex. `KP-2026-A1B2`) ← l'identifiant remis au client
  - `email`, `first_name`, `last_name`, `phone`
  - `activity` (kitesurf | wingfoil | pumpfoil)
  - `package_type` (carte | stage_5j | stage_3j | …)
  - `total_sessions` (ex. 5), `used_sessions` (compteur)
  - `deposit_amount`, `deposit_paid_at`, `stripe_session_id`
  - `status` (active | completed | cancelled | expired)
  - `expires_at` (validité, ex. fin de saison)
  - `notes_admin`

- **`package_bookings`** — chaque journée réservée par le client via son code
  - `package_id` → `client_packages.id`
  - `session_id` → `sessions.id` (la session existante du jour)
  - `status` (confirmed | cancelled)
  - `created_at`

Triggers :
- Décrémenter `used_sessions` à l'annulation, incrémenter à la réservation
- Empêcher de réserver si `used_sessions >= total_sessions`
- Respecter `max_participants` (4 kite / 3 wing / 3 pump) — déjà géré par `validate_session_max_participants`

RLS :
- Lecture publique d'un package **uniquement via `package_code`** (RPC `get_package_by_code`)
- Insertion uniquement par le webhook Stripe (service_role)
- Admin : full access via `has_role('admin')`

---

## 2. Flux client

### a) Achat & réception du code
1. Client paie l'acompte via Stripe (flux existant `create-checkout`)
2. Le webhook `stripe-webhook` :
   - Crée le `client_package` avec un `package_code` généré
   - Envoie l'email de confirmation (template Resend) avec **le code + lien direct vers `/mon-espace`**

### b) Espace client `/mon-espace/:code?` (nouvelle page publique)
- Saisie du code OU lien direct depuis l'email
- Affiche :
  - Activité, nombre de sessions restantes, dates déjà réservées
  - **Calendrier mensuel** des sessions disponibles (filtré par activité)
  - Bouton "Réserver cette journée" (avec créneau matin/après-midi)
- Permet d'**annuler** une journée réservée jusqu'à J-2

Pas de compte / mot de passe : le `package_code` fait office de jeton (UUID + suffixe court). Rate-limiting sur la RPC.

### c) Stages discontinus
Même mécanique : un stage 5j = `total_sessions = 5`. Le client choisit librement 5 journées non-consécutives selon la météo.

---

## 3. Administration (`/admin`)

Nouvel onglet **"Packs clients"** :
- Liste des `client_packages` (filtres : actifs, expirés, activité)
- Pour chaque pack : crédits restants, journées réservées, acompte payé, code
- Actions admin :
  - Ajuster `total_sessions` (geste commercial)
  - Déplacer une réservation (changer `session_id`)
  - Annuler / réactiver un pack
  - Renvoyer l'email avec le code
- Vue "Participants par journée" : déjà couverte par le calendrier admin existant, on y ajoute le `package_code` à côté du nom

---

## 4. UX / Design

- Calendrier mensuel responsive (réutilise `react-day-picker` déjà présent)
- Cards "session disponible" avec pastille couleur par activité (Ocean Blue / Orange Sunset)
- Compteur visuel de crédits restants ("3 / 5 sessions")
- Mobile-first, touch targets 44px (mémoire projet)
- Cohérence avec la charte existante (Montserrat / Inter, Ocean Blue #0891B2)

---

## 5. SEO & conversion

- Page `/mon-espace` en `noindex` (espace privé)
- CTA "Réservez votre pack" sur Tarifs / Cours à la Carte / Stages → Stripe
- Email de confirmation avec le code = engagement renforcé
- Lien depuis `/merci` : "Votre code de réservation : KP-XXXX → accéder à mon espace"

---

## Détails techniques

```text
Tables: client_packages, package_bookings
RPC:    get_package_by_code(code text) → package + bookings
        book_session(code text, session_id uuid) → booking
        cancel_booking(code text, booking_id uuid) → bool
Edge:   stripe-webhook (modifié) — génère le code + envoie email
        send-package-code (nouveau) — renvoi du code par email
Pages:  src/pages/MonEspace.tsx (nouveau, route /mon-espace/:code?)
Admin:  src/components/admin/AdminPackagesManager.tsx (nouveau)
        + nouvel onglet dans Admin.tsx
Lib:    src/lib/package-code.ts (génération KP-YYYY-XXXX)
Email:  template "package-confirmation" (code + lien magique)
```

Les contraintes max_participants existantes restent en vigueur (trigger `validate_session_max_participants`).

---

## Étapes d'implémentation (ordre proposé)

1. Migration DB (tables, RPC, RLS, triggers de décompte)
2. Modif `stripe-webhook` : création du pack + email avec code
3. Page `/mon-espace` (saisie code + calendrier + réservations)
4. Onglet admin "Packs clients"
5. CTA + lien depuis `/merci` et email
6. Tests E2E (achat → email → réservation → annulation → admin)

---

## Questions avant d'attaquer

1. **Validité d'un pack** : fin de saison (30 sept) ou 12 mois après achat ?
2. **Annulation client** : J-2 acceptable, ou autre délai ?
3. **Acompte vs solde** : le solde se règle sur place ou je gère aussi un paiement final en ligne ?
4. **Code format** : `KP-2026-A1B2` (court, mémorisable) OK ou tu préfères un UUID complet ?

Réponds à ces 4 points et je lance la migration + l'implémentation dans la foulée.
