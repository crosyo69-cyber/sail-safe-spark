-- P0 — Idempotence Stripe & déduplication webhook
-- NON APPLIQUÉ. À passer tel quel à l'outil de migration dès que la base répond.

-- 1) Journal des événements webhook Stripe
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id      TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accès réservé aux fonctions serveur (aucune lecture client)
GRANT ALL ON public.stripe_webhook_events TO service_role;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy : anon/authenticated n'ont aucun accès.

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at
  ON public.stripe_webhook_events (created_at DESC);

-- 2) Claim atomique : true = ce process a le droit de traiter l'événement
CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id   TEXT,
  p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted TEXT;
BEGIN
  INSERT INTO public.stripe_webhook_events (event_id, event_type, status)
  VALUES (p_event_id, p_event_type, 'received')
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id INTO v_inserted;

  RETURN v_inserted IS NOT NULL;
END;
$$;

-- 3) Marquage du résultat de traitement
CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event(
  p_event_id      TEXT,
  p_status        TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.stripe_webhook_events
     SET status        = p_status,
         error_message = p_error_message,
         updated_at    = now()
   WHERE event_id = p_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_stripe_webhook_event(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stripe_webhook_event(TEXT, TEXT, TEXT) TO service_role;

-- 4) Un seul pack de crédits par session Stripe
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_packages_stripe_session_id
  ON public.client_packages (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- 5) Un seul email en attente par message_id déterministe
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_send_log_pending_message_id
  ON public.email_send_log (message_id)
  WHERE status = 'pending';