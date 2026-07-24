# Refonte : suppression des créneaux horaires, gestion par groupes dynamiques

## Nouveau modèle métier

- Le client choisit uniquement : **activité** (Kitesurf/Wingfoil), **date**, **nombre de participants**.
- Aucun horaire n'apparaît nulle part côté client ni admin (l'horaire est communiqué par téléphone la veille).
- Les groupes sont créés dynamiquement à la volée selon les réservations :
  - Kitesurf → max 4 par groupe
  - Wingfoil → max 3 par groupe
- Aucune limite « 3 créneaux/jour ». Autant de groupes que nécessaire, dans n'importe quelle combinaison d'activités.

## Changements base de données

Migration Supabase :

1. **Ajout `daily_groups`** (remplace la logique de `sessions` liée aux time_slots) :
   - `date`, `activity` (kitesurf|wingfoil), `group_index` (1,2,3…), `max_participants`, `status`.
   - Unique `(date, activity, group_index)`.
2. **`package_bookings` et `reservations`** : ajout `daily_group_id` (nullable pendant transition), garder `session_id` pour compat historique.
3. **Nouvelles RPC** :
   - `book_daily_with_code(p_code, p_date, p_participants=1)` : trouve ou crée le premier groupe non plein de l'activité du pack pour cette date.
   - `book_daily_visitor(...)` : équivalent pour paiement Stripe.
   - `get_daily_availability(p_date)` : renvoie `{ kitesurf: {inscrits, groupes, places_restantes}, wingfoil: {…} }`.
4. **Neutraliser** les triggers/RPC basés sur `time_slot` (les garder mais non appelés).
5. **Migrer** les réservations futures : chaque `sessions` future devient un `daily_group` correspondant.

## Changements code

### Frontend client
- `DepositPaymentSection.tsx` : retirer sélection de créneau, ne demander que date + activité + nb participants.
- `MonEspace.tsx` : le calendrier affiche par jour un simple bouton « Réserver » par activité, avec le nombre de places dispo cumulées de la journée. Suppression des 3 slots.
- `Reserver.tsx` : idem, vue jour → une seule action de réservation.
- Emails de confirmation (`enqueue_booking_confirmation`) : remplacer horaire par le message « les horaires seront communiqués la veille ».

### Sync Stripe
- `sync-stripe-reservations` : remplacer toute la logique multi-slot par un simple appel à la nouvelle RPC visitor (activité + date). Suppression des SLOTS, de `findOrCreateSession`, des emails de bascule.

### Admin
- `AdminCreneaux.tsx` → renommé « Gestion des journées » : vue par date avec, pour chaque activité, `inscrits / groupes / places restantes` + liste des groupes.
- `AdminMonthlyCalendar.tsx` / `AdminSessionManager.tsx` : adapter à la vue journée.
- `AdminReservationList.tsx` : retirer colonne horaire.

### Suppression / dépréciation
- Suppression cron `auto_generate_sessions` (déjà désarmé).
- Retrait UI des time_slots partout.

## Migration des données existantes

- Sessions futures (`date >= today`) : convertir chaque session en `daily_group` (activity conservée, `group_index` = ordre chronologique dans la journée).
- Bookings/reservations : rattachement au `daily_group` correspondant.
- Sessions passées : conservées telles quelles pour l'historique/reporting.

## Livraison en 3 étapes

1. **Migration DB** (tables, RPC, backfill des données futures).
2. **Frontend client + emails** (le client ne voit plus les horaires).
3. **Admin** (nouvelle vue journée + audit adapté).

## Points d'attention

- Cette refonte casse des contrats d'API existants (edge functions, e2e tests). Les tests Playwright liés aux time_slots devront être mis à jour dans un second temps.
- Les packs Stage 100% Glisse (5 jours consécutifs) restent basés sur `book_stage_100_glisse` : à adapter aussi pour utiliser `daily_group` au lieu de `session_id` + `time_slot`.
- Les crédits météo (`admin_grant_weather_credit_booking`) : à adapter.

## Confirmation demandée avant implémentation

1. OK pour supprimer complètement la notion de time_slot côté client ET admin (plus aucun affichage matin/après-midi) ?
2. OK pour conserver la table `sessions` en lecture seule pour l'historique et créer une nouvelle table `daily_groups` (approche plus sûre qu'un ALTER destructif) ?
3. Stage 100% Glisse : on garde le principe « 5 jours consécutifs » mais sans time_slot (une réservation par jour) ?
