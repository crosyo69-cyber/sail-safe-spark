-- F-23-01/03 : quota global atomique réutilisable (2e barrière indépendante de l'IP).
CREATE OR REPLACE FUNCTION public.public_quota_guard(
  p_context text,
  p_limit integer,
  p_window interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Compteur global : clé fixe, donc insensible à la rotation d'IP.
  RETURN public.public_rate_guard(p_context, 'GLOBAL', p_limit, p_window);
END;
$$;

REVOKE ALL ON FUNCTION public.public_quota_guard(text, integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_quota_guard(text, integer, interval) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_quota_guard(text, integer, interval) TO service_role;

-- F-23-06 : ingestion analytics via RPC contrôlée (validation + rate guard).
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
  v_session text := left(coalesce(btrim(p_session_id), ''), 64);
  v_path text := left(coalesce(p_path_clean(p_page_path), ''), 512);
BEGIN
  IF p_event_type IS NULL OR p_event_type NOT IN ('page_view', 'phone_click', 'form_submit') THEN
    RETURN false;
  END IF;
  IF v_session = '' THEN
    RETURN false;
  END IF;
  -- Metadata bornée : taille et nombre de clés.
  IF p_metadata IS NOT NULL THEN
    IF jsonb_typeof(p_metadata) <> 'object'
       OR length(p_metadata::text) > 2000
       OR (SELECT count(*) FROM jsonb_object_keys(p_metadata)) > 20 THEN
      RETURN false;
    END IF;
  END IF;

  -- Rate limit par session puis quota global (fail-closed : pas d'insert si refus).
  IF NOT public.public_rate_guard('analytics_event', v_session, 60, interval '1 minute') THEN
    RETURN false;
  END IF;
  IF NOT public.public_rate_guard('analytics_event_global', 'GLOBAL', 20000, interval '1 hour') THEN
    RETURN false;
  END IF;

  INSERT INTO public.analytics_events(event_type, session_id, page_path, location, metadata)
  VALUES (
    p_event_type,
    v_session,
    nullif(v_path, ''),
    left(p_path_clean(p_location), 128),
    p_metadata
  );
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
  v_path text := left(coalesce(p_path_clean(p_path), ''), 512);
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
  VALUES (v_path, left(p_path_clean(p_referrer), 512), left(p_path_clean(p_user_agent), 512));
  RETURN true;
END;
$$;
