## Objectif

Mettre en place un système d'alertes unifié pour le back-office Kitesurf Passion couvrant :
1. **Alertes admin métier** — nouvelle réservation Stripe, session pleine, paiement échoué, recrédit manuel
2. **Alertes last-minute** — notifier les abonnés `last_minute_subscribers` quand une place se libère sur une session passée en `closed`/`cancelled` puis rouverte
3. **Alertes techniques** — emails en DLQ, échecs webhook Stripe, pic anormal de 404, erreurs edge functions

Canaux : **email** (vers `crosyo69@gmail.com` pour admin/tech) + **centre de notifications dans l'admin** (badge cloche + liste).

---

## 1. Modèle de données

Nouvelle table `admin_notifications` :
- `kind` (text) — `booking_new`, `session_full`, `payment_failed`, `admin_credit`, `email_dlq`, `stripe_webhook_error`, `404_spike`, `last_minute_freed`
- `severity` (text) — `info`, `warning`, `critical`
- `title`, `body` (text)
- `metadata` (jsonb) — IDs liés (session_id, reservation_id, message_id…)
- `read_at` (timestamptz, nullable)
- `email_sent_at` (timestamptz, nullable)
- `created_at`

RLS : admin-only (SELECT/UPDATE/DELETE via `has_role`), `service_role` full access, INSERT autorisé via SECURITY DEFINER `enqueue_admin_notification(kind, severity, title, body, metadata)`.

Realtime activé pour push live du badge.

---

## 2. Sources d'alertes (triggers + edge functions)

| Alerte | Source | Implémentation |
|---|---|---|
| Nouvelle réservation Stripe | trigger AFTER INSERT sur `reservations` (status='confirmed', stripe_session_id IS NOT NULL) | trigger DB → `enqueue_admin_notification` |
| Session pleine | dans `enforce_session_capacity` quand v_count+v_new_seats = capacity | ajout PERFORM enqueue |
| Recrédit manuel | dans `admin_adjust_package_credits` | ajout PERFORM enqueue (info) |
| Email DLQ | edge function `email-queue-health-check` (cron déjà existant) | enqueue si DLQ > seuil |
| Last-minute freed | trigger sync_package_used_sessions quand delta=+1 et reservations existantes pour ce slot avec `last_minute_subscribers` matching | enqueue + invoke `last-minute-notify` |
| Stripe webhook error | dans `stripe-webhook/index.ts` catch | appel direct `enqueue_admin_notification` via service role |
| 404 spike | nouvelle edge function cron `monitor-404-spike` (toutes les 30min) | si > N événements /h → enqueue |

---

## 3. Envoi email admin

Nouvelle edge function cron `dispatch-admin-alerts` (toutes les 2 min) :
- lit `admin_notifications WHERE email_sent_at IS NULL AND severity IN ('warning','critical')`
- regroupe par batch (anti-spam : max 1 email/5min sur même `kind`)
- enqueue email via `transactional_emails` queue (template HTML Navy/Orange existant) à `crosyo69@gmail.com`
- marque `email_sent_at = now()`

Les alertes `info` (ex : recrédit manuel, nouvelle résa) restent visibles dans l'admin sans spam mail.

---

## 4. UI Admin — Centre de notifications

Nouveau composant `AdminNotificationsBell` dans `Header` admin :
- icône cloche avec badge `unread_count`
- popover : 20 dernières notifications, groupées par jour
- couleurs par sévérité (badge), icône par `kind`
- actions : "Marquer comme lue", "Tout marquer comme lu", lien vers ressource liée si applicable
- abonnement Realtime sur `admin_notifications` pour incrément live
- nouvelle page `/admin/alertes` : vue complète paginée + filtres (kind, severity, période, read/unread)

---

## 5. Configuration

Section dans `AdminOverview` : "Paramètres d'alertes" :
- seuils : DLQ count, 404/h, sessions complètes par jour
- toggle par `kind` : envoyer email oui/non
- stockés dans nouvelle table `admin_alert_settings` (single row, admin-only)

---

## Détails techniques

- Tous les triggers utilisent `SECURITY DEFINER` avec `search_path = public`
- La fonction `enqueue_admin_notification` est appelée depuis triggers DB et edge functions (service role)
- Realtime : `ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications`
- Template email réutilise la charte Navy `#0F172A` + Orange `#F97316` + logo bucket
- Anti-doublon : index unique partiel sur `(kind, metadata->>'ref_id', date_trunc('hour', created_at))` pour éviter de réinsérer la même alerte critique en boucle
- `dispatch-admin-alerts` planifié via `pg_cron` (insert manuel, contient anon_key projet)

---

## Livrables

1. Migration : table `admin_notifications`, table `admin_alert_settings`, RLS, fonction `enqueue_admin_notification`, ajouts dans triggers existants (`enforce_session_capacity`, `admin_adjust_package_credits`, nouveau trigger `reservations`), publication realtime
2. Edge function `dispatch-admin-alerts` + cron 2min
3. Edge function `monitor-404-spike` + cron 30min
4. Hooks dans `stripe-webhook` et `email-queue-health-check` pour enqueue d'alertes
5. UI : `AdminNotificationsBell` (popover Header), page `/admin/alertes`, section paramètres dans `AdminOverview`
6. Lien vers `last-minute-notify` déclenché automatiquement par trigger sur libération de place

Confirme et je code l'ensemble, ou dis-moi quels modules retirer/prioriser.