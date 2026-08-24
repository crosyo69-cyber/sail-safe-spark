CREATE TABLE IF NOT EXISTS public.email_send_claims (
  message_id text PRIMARY KEY,
  worker_id text,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

GRANT ALL ON public.email_send_claims TO service_role;

ALTER TABLE public.email_send_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_send_claims_service_role_only"
ON public.email_send_claims FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_email_send_claims_expires ON public.email_send_claims (expires_at);

CREATE OR REPLACE FUNCTION public.claim_email_send(
  _message_id text,
  _worker_id text DEFAULT NULL,
  _lease_seconds integer DEFAULT 120
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed integer;
BEGIN
  IF _message_id IS NULL OR _message_id = '' THEN
    RETURN true;
  END IF;

  -- Never re-send a message already logged as sent.
  IF EXISTS (
    SELECT 1 FROM public.email_send_log
    WHERE message_id = _message_id AND status = 'sent'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.email_send_claims (message_id, worker_id, claimed_at, expires_at)
  VALUES (_message_id, _worker_id, now(), now() + make_interval(secs => GREATEST(_lease_seconds, 10)))
  ON CONFLICT (message_id) DO UPDATE
    SET worker_id = EXCLUDED.worker_id,
        claimed_at = now(),
        expires_at = EXCLUDED.expires_at
    WHERE public.email_send_claims.expires_at <= now();

  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_send(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_send(text, text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.release_email_claim(_message_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.email_send_claims WHERE message_id = _message_id;
$$;

REVOKE ALL ON FUNCTION public.release_email_claim(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_email_claim(text) TO service_role;

CREATE OR REPLACE FUNCTION public.purge_expired_email_claims()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.email_send_claims WHERE expires_at < now() - interval '1 day';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_email_claims() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_email_claims() TO service_role;