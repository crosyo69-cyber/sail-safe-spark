## Système "Dernière Minute" — réservation dynamique

### 1. Modèle de données

Champs ajoutés à `sessions` :
- `is_last_minute` (bool, default false) — créneau ouvert tardivement
- `last_minute_label` (text, nullable) — `fire` 🔥 ou `wind` 🌬️
- `published_at` (timestamptz) — moment d'ouverture publique
- `instructors_count` (int, default 1) — pour calculer la capacité dynamique
- `weather_note` (text) — vent prévu / fenêtre météo

Nouvelle table `last_minute_subscribers` :
- `email`, `phone` (optionnel), `activities[]` (kitesurf|wingfoil|kitefoil)
- `unsubscribe_token`, `enabled`, timestamps
- RLS : INSERT public, SELECT service_role uniquement

### 2. Backend (Lovable Cloud)

- Trigger SQL : à `UPDATE` de `sessions` où `is_last_minute` passe true → `pg_notify('last_minute_opened', session_id)`
- Edge function `notify-last-minute` :
  - lit la session, sélectionne les abonnés concernés (activité matchée + enabled)
  - enqueue un email par destinataire via `send-transactional-email` (template `last-minute-session`)
  - SMS = phase 2 (placeholder désactivé tant qu'aucun fournisseur SMS n'est branché)
- Capacité live = `max_participants * instructors_count - (reservations confirmées + package_bookings)`
- Statut auto "Complet" calculé côté lecture (vue) + trigger qui passe `status='closed'` quand plein

### 3. Realtime public

- `ALTER PUBLICATION supabase_realtime ADD TABLE sessions, reservations, package_bookings`
- Hook `useLastMinuteSessions()` :
  - SELECT sessions où `is_last_minute = true AND date >= today AND status='open'`
  - subscribe aux changements → recalcul places restantes
- Affichage dans `Index.tsx` (nouvelle section "Dernière Minute") + page dédiée `/dernieres-minutes`
- Filtre "Cette semaine uniquement" (toggle local)

### 4. Réservation

- Formulaire allégé (nom, email, tél, participants) → réutilise flux Stripe 50€ existant
- Si un `package_code` est saisi : appel RPC `book_session_with_code` → pas d'acompte
- Décrément automatique géré par les triggers/agrégats existants (`sync_package_used_sessions`) + lecture live

### 5. Admin

Nouvel onglet **"Dernière Minute"** dans `Admin.tsx` :
- Bouton "Ouvrir un créneau dernière minute" → modal :
  - activité, date, créneau, instructeurs, label (🔥 / 🌬️), note météo
- Liste des créneaux dernière minute actifs + places restantes en live
- Bouton "Fermer" / "Renotifier les abonnés"

### 6. UI / Design

- Badge `🔥 Session Dernière Minute` (gradient Orange Sunset) ou `🌬️ Conditions exceptionnelles` (Ocean Blue)
- Compteur "X places restantes" pulse rouge si ≤ 2
- Section homepage : carrousel des prochaines sessions dernière minute
- Form d'abonnement aux alertes (1 champ email + cases activités) sur la page

### 7. Notifications

- Template React Email `last-minute-session.tsx` :
  - badge, activité, date/heure, places, lien "Je réserve"
- Page `/alertes-dernieres-minutes` : abonnement + désabonnement via token

### 8. SEO

- `/dernieres-minutes` : title "Sessions kitesurf dernière minute — Kitesurf Passion Hyères"
- Pas de noindex (page conversion)

### 9. Étapes d'implémentation

1. Migration DB (colonnes sessions, table abonnés, trigger notify, realtime)
2. Edge function `notify-last-minute` + template email
3. Hook `useLastMinuteSessions` + composant `LastMinuteSection`
4. Page publique `/dernieres-minutes` + formulaire d'alerte
5. Admin onglet "Dernière Minute" (création/fermeture/renotification)
6. Intégration packs (réservation via `package_code` sans acompte)
7. Page désabonnement `/alertes-dernieres-minutes/desabonnement`

### 10. Questions avant de lancer

1. **SMS** : on garde uniquement email pour la v1, SMS plus tard via Twilio/connector, OK ?
2. **Capacité** : `max_participants × instructors_count` ou tu préfères saisir directement le total ?
3. **Abonnement aux alertes** : ouvert à tous sans compte (juste email), confirmation par double opt-in oui/non ?
4. **Acompte** : pour un client SANS pack, on garde le 50€ Stripe habituel ? (cohérent avec les mémoires projet)

Réponds et je lance la migration + l'implémentation.
