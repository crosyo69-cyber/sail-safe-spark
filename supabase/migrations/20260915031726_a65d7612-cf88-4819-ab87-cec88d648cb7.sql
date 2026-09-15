-- F-23-06 : correction — nettoyage des caractères de contrôle en ligne (pas de helper externe).
CREATE OR REPLACE FUNCTION public.log_analytics_event(
  p_event_type text,
  p_session_id text,
  p_page_path text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session text := left(regexp_replace(coalesce(btrim(p_session_id), ''), '[[:cntrl:]]', '', 'g'), 64);
  v_path text := left(regexp_replace(coalesce(p_page_path, ''), '[[:cntrl:]]', '', 'g'), 512);
  v_loc text := left(regexp_replace(coalesce(p_location, ''), '[[:cntrl:]]', '', 'g'), 128);
BEGIN
  IF p_event_type IS NULL OR p_event_type NOT IN ('page_view', 'phone_click', 'form_submit') THEN
    RETURN false;
  END IF;
  IF v_session = '' THEN
    RETURN false;
  END IF;
  IF p_metadata IS NOT NULL THEN
    IF jsonb_typeof(p_metadata) <> 'object'
       OR length(p_metadata::text) > 2000
       OR (SELECT count(*) FROM jsonb_object_keys(p_metadata)) > 20 THEN
      RETURN false;
    END IF;
  END IF;

  IF NOT public.public_rate_guard('analytics_event', v_session, 60, interval '1 minute') THEN
    RETURN false;
  END IF;
  IF NOT public.public_rate_guard('analytics_event_global', 'GLOBAL', 20000, interval '1 hour') THEN
    RETURN false;
  END IF;

  INSERT INTO public.analytics_events(event_type, session_id, page_path, location, metadata)
  VALUES (p_event_type, v_session, nullif(v_path, ''), nullif(v_loc, ''), p_metadata);
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_page_404(
  p_path text,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_path text := left(regexp_replace(coalesce(btrim(p_path), ''), '[[:cntrl:]]', '', 'g'), 512);
  v_ref text := left(regexp_replace(coalesce(p_referrer, ''), '[[:cntrl:]]', '', 'g'), 512);
  v_ua text := left(regexp_replace(coalesce(p_user_agent, ''), '[[:cntrl:]]', '', 'g'), 512);
BEGIN
  IF v_path = '' THEN
    RETURN false;
  END IF;
  IF NOT public.public_rate_guard('page_404_log', v_path, 20, interval '1 hour') THEN
    RETURN false;
  END IF;
  IF NOT public.public_rate_guard('page_404_log_global', 'GLOBAL', 2000, interval '1 hour') THEN
    RETURN false;
  END IF;

  INSERT INTO public.page_404_logs(path, referrer, user_agent)
  VALUES (v_path, nullif(v_ref, ''), nullif(v_ua, ''));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.log_analytics_event(text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_page_404(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_analytics_event(text, text, text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_page_404(text, text, text) TO anon, authenticated, service_role;

-- Ingestion désormais exclusivement via RPC contrôlée : plus d'INSERT direct.
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow anonymous inserts on page_404_logs" ON public.page_404_logs;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.analytics_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.page_404_logs FROM anon;
REVOKE INSERT, UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.page_404_logs FROM authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
