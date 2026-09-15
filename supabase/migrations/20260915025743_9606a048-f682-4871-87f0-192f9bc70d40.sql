-- F-22-HARDENING — double opt-in météo, anti-doublon d'envoi, rétention.

ALTER TABLE public.weather_alert_subscriptions
  ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_alert_sent_at timestamptz;

-- Grandfathering explicite : les abonnements déjà actifs avant le double opt-in
-- restent actifs (aucune suppression, aucune désactivation).
UPDATE public.weather_alert_subscriptions
   SET confirmed = true,
       confirmed_at = COALESCE(confirmed_at, created_at)
 WHERE confirmed = false;

CREATE UNIQUE INDEX IF NOT EXISTS ux_was_email_lower
  ON public.weather_alert_subscriptions (lower(email));

-- F-22-01 : plus aucun chemin d'INSERT anon/authenticated direct.
DROP POLICY IF EXISTS "Public can subscribe to weather alerts" ON public.weather_alert_subscriptions;
REVOKE INSERT ON public.weather_alert_subscriptions FROM anon;
REVOKE INSERT ON public.weather_alert_subscriptions FROM authenticated;

-- Token de confirmation météo : purpose distinct, expiration obligatoire (48h).
CREATE OR REPLACE FUNCTION public.issue_link_token(p_purpose text, p_subject_id text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_token uuid; v_purpose text; v_expires timestamptz;
BEGIN
  IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
    RAISE EXCEPTION 'purpose_required';
  END IF;
  IF p_subject_id IS NULL OR btrim(p_subject_id) = '' THEN
    RAISE EXCEPTION 'subject_required';
  END IF;

  v_purpose := btrim(p_purpose);

  IF p_expires_at IS NOT NULL THEN
    v_expires := p_expires_at;
  ELSIF v_purpose = 'weather_confirm' THEN
    v_expires := now() + interval '48 hours';
  ELSIF v_purpose IN ('weather_unsubscribe', 'last_minute_confirm', 'last_minute_unsubscribe') THEN
    v_expires := now() + interval '12 months';
  ELSE
    v_expires := NULL;
  END IF;

  v_token := gen_random_uuid();

  INSERT INTO public.public_link_tokens (purpose, subject_id, token_hash, expires_at)
  VALUES (v_purpose, btrim(p_subject_id),
          public.code_access_hash(v_token::text), v_expires);

  RETURN v_token::text;
END;
$function$;

-- Confirmation du double opt-in : token à usage unique (révoqué après usage).
CREATE OR REPLACE FUNCTION public.confirm_weather_subscription(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_subject text; v_count integer;
BEGIN
  v_subject := public.resolve_link_token('weather_confirm', p_token);
  IF v_subject IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.weather_alert_subscriptions
     SET confirmed = true,
         confirmed_at = COALESCE(confirmed_at, now()),
         enabled = true,
         updated_at = now()
   WHERE id = v_subject::uuid;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.public_link_tokens
     SET revoked_at = now()
   WHERE purpose = 'weather_confirm'
     AND subject_id = v_subject
     AND revoked_at IS NULL;

  RETURN v_count > 0;
END;
$function$;

-- F-22-03 : sélection atomique d'un lot (batch limit + dédup journalière +
-- protection contre deux exécutions concurrentes du cron).
CREATE OR REPLACE FUNCTION public.weather_alert_claim_batch(p_wind integer, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT w.id
      FROM public.weather_alert_subscriptions w
     WHERE w.enabled = true
       AND w.confirmed = true
       AND w.min_wind <= p_wind
       AND w.max_wind >= p_wind
       AND (w.last_alert_sent_at IS NULL OR w.last_alert_sent_at < now() - interval '12 hours')
     ORDER BY w.last_alert_sent_at NULLS FIRST, w.created_at
     LIMIT v_limit
     FOR UPDATE SKIP LOCKED
  )
  UPDATE public.weather_alert_subscriptions w
     SET last_alert_sent_at = now(), updated_at = now()
    FROM candidates c
   WHERE w.id = c.id
  RETURNING w.id, w.email;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_weather_subscription(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.weather_alert_claim_batch(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_weather_subscription(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.weather_alert_claim_batch(integer, integer) TO service_role;

-- F-22-07 : rétention, branchée sur le cron de purge existant (retention-logs-purge-daily).
CREATE OR REPLACE FUNCTION public.purge_retention_logs()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_started timestamptz := clock_timestamp();
  v_analytics int := 0;
  v_rate int := 0;
  v_code int := 0;
  v_notif int := 0;
  v_assist int := 0;
  v_sync int := 0;
  v_runs int := 0;
  v_email_anon int := 0;
  v_email_del int := 0;
  v_weather_pending int := 0;
  v_weather_off int := 0;
  v_lm_pending int := 0;
  v_waitlist int := 0;
BEGIN
  DELETE FROM public.analytics_events WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_analytics = ROW_COUNT;

  DELETE FROM public.public_rate_attempts WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_rate = ROW_COUNT;

  DELETE FROM public.code_access_attempts WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_code = ROW_COUNT;

  DELETE FROM public.admin_notifications
   WHERE read_at IS NOT NULL AND created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_notif = ROW_COUNT;

  DELETE FROM public.assistant_conversations WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_assist = ROW_COUNT;

  DELETE FROM public.marketing_sync_logs WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_sync = ROW_COUNT;

  DELETE FROM public.session_generation_runs WHERE ran_at < now() - interval '180 days';
  GET DIAGNOSTICS v_runs = ROW_COUNT;

  UPDATE public.email_send_log
     SET recipient_email = 'redacted+' || md5(recipient_email) || '@invalid'
   WHERE created_at < now() - interval '90 days'
     AND status <> 'processing'
     AND recipient_email NOT LIKE 'redacted+%@invalid';
  GET DIAGNOSTICS v_email_anon = ROW_COUNT;

  DELETE FROM public.email_send_log
   WHERE created_at < now() - interval '365 days'
     AND status <> 'processing';
  GET DIAGNOSTICS v_email_del = ROW_COUNT;

  -- F-22-07 : demandes météo jamais confirmées (double opt-in abandonné) > 30 jours.
  DELETE FROM public.weather_alert_subscriptions
   WHERE confirmed = false AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_weather_pending = ROW_COUNT;

  -- F-22-07 : abonnements météo désactivés depuis plus de 12 mois.
  DELETE FROM public.weather_alert_subscriptions
   WHERE enabled = false AND updated_at < now() - interval '12 months';
  GET DIAGNOSTICS v_weather_off = ROW_COUNT;

  -- F-22-07 : inscriptions Last Minute jamais confirmées > 30 jours.
  DELETE FROM public.last_minute_subscribers
   WHERE confirmed = false AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_lm_pending = ROW_COUNT;

  -- F-22-07 : lignes de liste d'attente terminées depuis plus de 6 mois.
  DELETE FROM public.daily_waitlist
   WHERE status <> 'pending' AND updated_at < now() - interval '180 days';
  GET DIAGNOSTICS v_waitlist = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'duration_ms', (extract(epoch from clock_timestamp() - v_started) * 1000)::int,
    'analytics_events_deleted', v_analytics,
    'public_rate_attempts_deleted', v_rate,
    'code_access_attempts_deleted', v_code,
    'admin_notifications_deleted', v_notif,
    'assistant_conversations_deleted', v_assist,
    'marketing_sync_logs_deleted', v_sync,
    'session_generation_runs_deleted', v_runs,
    'email_send_log_anonymized', v_email_anon,
    'email_send_log_deleted', v_email_del,
    'weather_pending_deleted', v_weather_pending,
    'weather_disabled_deleted', v_weather_off,
    'last_minute_pending_deleted', v_lm_pending,
    'waitlist_finished_deleted', v_waitlist
  );
END;
$function$;