# P0 — Idempotence Stripe & déduplication webhook

Statut : 🟡 CODE VALIDÉ / DB NON VALIDÉE — 🔴 P0 NO-GO

Rien dans ce document n'a été exécuté. Aucune migration appliquée, aucune preuve DB produite.
Le code P0 est gelé : ne plus le modifier avant validation DB.

---

## A. Migration SQL finale (à appliquer telle quelle)

Fichier : `docs/sql/p0-stripe-idempotence.sql` (copie byte-for-byte à passer à l'outil de migration).

Contenu :
1. Table `public.stripe_webhook_events` (+ GRANT service_role, RLS activée, aucune policy publique).
2. RPC atomique `public.claim_stripe_webhook_event(p_event_id text, p_event_type text) returns boolean`.
3. RPC `public.mark_stripe_webhook_event(p_event_id text, p_status text, p_error text)`.
4. Index unique `uq_client_packages_stripe_session_id` sur `client_packages(stripe_session_id)`.
5. Index unique partiel `uq_email_send_log_pending_message_id` sur `email_send_log(message_id)` pour `status = 'pending'`.

---

## B. Script de vérification (lecture seule, après application)

```sql
-- 1. Table présente
SELECT schemaname, tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'stripe_webhook_events';

-- 2. Index uniques
SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'uq_client_packages_stripe_session_id',
    'uq_email_send_log_pending_message_id',
    'stripe_webhook_events_pkey'
  )
ORDER BY tablename, indexname;

-- 3. Contraintes
SELECT conname, contype, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE conrelid IN (
  'public.stripe_webhook_events'::regclass,
  'public.client_packages'::regclass
)
ORDER BY conrelid::regclass::text, conname;

-- 4. Signatures RPC
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args,
       pg_get_function_result(p.oid)            AS returns,
       p.prosecdef                              AS security_definer,
       p.proconfig                              AS config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('claim_stripe_webhook_event', 'mark_stripe_webhook_event');

-- 5. RLS active
SELECT relname, relrowsecurity FROM pg_class
WHERE oid = 'public.stripe_webhook_events'::regclass;
```

Critères d'acceptation : 1 ligne en (1), les 3 index en (2), `search_path` figé + `security definer` en (4), `relrowsecurity = true` en (5).

---

## C. Tests DB à exécuter après réveil de la base

### C1 — Double claim du même `event_id` → exactement un succès
```sql
BEGIN;
SELECT public.claim_stripe_webhook_event('evt_p0_proof_1', 'checkout.session.completed') AS first_claim;  -- attendu: true
SELECT public.claim_stripe_webhook_event('evt_p0_proof_1', 'checkout.session.completed') AS second_claim; -- attendu: false
SELECT event_id, status FROM public.stripe_webhook_events WHERE event_id = 'evt_p0_proof_1';
ROLLBACK;
```

### C2 — Deux packs avec le même `stripe_session_id` → une seule ligne
```sql
BEGIN;
INSERT INTO public.client_packages (stripe_session_id /*, colonnes obligatoires */)
VALUES ('cs_p0_proof_1' /*, ... */);
-- Doit lever 23505 :
INSERT INTO public.client_packages (stripe_session_id /*, colonnes obligatoires */)
VALUES ('cs_p0_proof_1' /*, ... */);
ROLLBACK;
```
Attendu : `ERROR: duplicate key value violates unique constraint "uq_client_packages_stripe_session_id"`.

### C3 — Deux emails pending avec le même `message_id` → une seule entrée
```sql
BEGIN;
INSERT INTO public.email_send_log (message_id, status /*, colonnes obligatoires */)
VALUES ('11111111-1111-4111-8111-111111111111', 'pending' /*, ... */);
-- Doit lever 23505 :
INSERT INTO public.email_send_log (message_id, status /*, colonnes obligatoires */)
VALUES ('11111111-1111-4111-8111-111111111111', 'pending' /*, ... */);
ROLLBACK;
```
Attendu : `ERROR: duplicate key value violates unique constraint "uq_email_send_log_pending_message_id"`.

Chaque test doit être joué en transaction et annulé (`ROLLBACK`) : aucune donnée de preuve ne reste en production.

---

## D. Statut

- 🟢 Implémentation code validée (15/15 tests Deno, typecheck propre)
- 🟡 Intégrité DB non validée (migration non appliquée)
- 🔴 GO production impossible tant que B et C n'ont pas produit de sorties réelles

Ces scripts ne doivent en aucun cas être considérés comme exécutés.
Ordre d'exécution dès que la base répond : A → B → C → publication des sorties brutes → décision GO/NO-GO.