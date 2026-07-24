
# Phase 5 — Dépréciation du modèle `sessions` / `time_slot`

Objectif : faire de `daily_groups` la seule source de vérité pour la planification, en retirant progressivement `sessions` / `time_slot` du code applicatif, sans casser l'historique de réservations ni les factures Stripe déjà émises.

## Principes

- **Pas de suppression SQL immédiate.** La table `sessions` contient des mois d'historique (rapports, revenus, factures). On la garde en base, mais on la traite comme un **journal en lecture seule** côté application. La suppression physique arrivera dans une phase 6 après export.
- **Un seul chemin d'écriture** : `book_daily_visitor` / `book_daily_with_code` / RPC admin `daily_groups`. Toutes les insertions dans `sessions` / `reservations.session_id` / `package_bookings.session_id` disparaissent du code.
- **Compatibilité historique** : les composants admin qui affichent des réservations passées lisent `sessions` en lecture seule tant qu'il reste des `reservations` avec `session_id` non nul.

## Périmètre

### 1. Edge Functions à migrer (écritures encore basées sur `sessions.time_slot`)

| Fichier | Action |
|---|---|
| `stripe-webhook/index.ts` | Retirer le fallback qui insère dans `sessions` avec `time_slot: 'morning'`. Router 100 % vers `book_daily_visitor` (déjà utilisé par `sync-stripe-reservations`). |
| `sync-stripe-reservations/index.ts` | Nettoyer les commentaires « New model » et supprimer les branches mortes qui référencent encore `time_slot`. |
| `notify-reservation/index.ts` | Remplacer le champ `time_slot` du payload par un champ `group_label` (ex : « Groupe Kitesurf ») ; l'horaire précis n'est plus exposé. |
| `last-minute-notify/index.ts` | Lire les groupes du jour depuis `daily_groups` au lieu de `sessions`. La colonne `time_slot` disparaît du SELECT. |
| `send-package-reminders/index.ts` | Lire les prochaines réservations via `package_bookings` joint à `daily_groups` (nouvelle colonne `group_id` — voir migration). |
| `weekly-summary/index.ts` | Récupérer les groupes de la semaine depuis `daily_groups` + agrégation par activité. Retirer le tri par `time_slot`. |

### 2. Frontend à migrer

| Fichier | Action |
|---|---|
| `src/pages/Reserver.tsx` | Cette page publique affiche encore une grille 3-créneaux/jour. La refondre en sélecteur date + activité (aligné sur `MonEspace.tsx`), en utilisant `get_daily_availability`. |
| `src/components/admin/AdminOverview.tsx` | Remplacer la liste « sessions du jour » par la liste des `daily_groups` du jour (deux colonnes Kite/Wing). |
| `src/components/admin/AdminReservationList.tsx` | Joindre `daily_groups` au lieu de `sessions`. Afficher la date + activité, sans créneau horaire. |
| `src/components/admin/AdminRevenueDashboard.tsx` | Grouper le CA par `daily_groups.activity` + date. Fallback lecture `sessions` si `group_id` est null (données historiques). |
| `src/components/admin/AdminSeasonStats.tsx` | Idem : agréger par `daily_groups` avec fallback historique. |

### 3. Base de données

Une migration unique :

- Ajouter `reservations.group_id UUID NULL REFERENCES public.daily_groups(id)` + index.
- Ajouter `package_bookings.group_id UUID NULL REFERENCES public.daily_groups(id)` + index.
- Mettre à jour les RPC `book_daily_visitor` et `book_daily_with_code` pour renseigner `group_id` en plus de `session_id` (double écriture pour la transition).
- Backfill : `UPDATE reservations SET group_id = ...` en joignant `sessions` → `daily_groups` sur `(date, activity)` quand un seul groupe existe.
- Aucune colonne supprimée (`session_id`, `time_slot`, `sessions.*` restent en place).

### 4. Suppression de la page `/admin/creneaux`

Elle reste en mode audit lecture seule. **Non supprimée** dans cette phase — le user a demandé de valider d'abord la nouvelle architecture en production sur plusieurs jours de réservation.

## Détails techniques

- Les emails ne mentionnent plus « matin/après-midi ». Nouveau libellé : « Groupe Kitesurf du {date} — horaire confirmé la veille par SMS ».
- `Reserver.tsx` : nouveau composant `<DailyGroupPicker>` réutilisable, partagé avec `MonEspace.tsx`.
- Backfill : loguer le nombre de `reservations` non résolues (dates avec 2+ groupes même activité). Ces cas restent liés uniquement à `session_id` — les rapports historiques les lisent via `sessions` en fallback.
- Tests : mettre à jour `_tests/concurrent-booking_test.ts` et `_tests/rbac-authorization_test.ts` pour cibler `daily_groups`.

## Séquencement (2 tours)

```text
Tour 1 — SQL + Edge Functions
  ├── migration : group_id + backfill + RPCs mises à jour
  └── refonte des 6 Edge Functions

Tour 2 — Frontend
  ├── Reserver.tsx (refonte publique)
  └── 4 composants admin (Overview, ReservationList, Revenue, SeasonStats)
```

Typecheck + déploiement Edge Functions à chaque tour. Rapport final listant fichiers modifiés, colonnes ajoutées, lignes backfillées.

## Hors périmètre

- Suppression physique de `sessions.time_slot` / de la table `sessions` (phase 6, après export CSV et validation prod).
- Suppression de `/admin/creneaux` (phase 6).
- Refonte visuelle de `Reserver.tsx` au-delà du remplacement de la grille (design identique à `MonEspace.tsx`).
