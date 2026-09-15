-- F-24-02 : allowlist explicite des Edge Functions invocables par les crons
CREATE OR REPLACE FUNCTION public.cron_invoke_edge_function(p_function_name text, p_body jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'net', 'vault'
AS $function$
DECLARE
  v_key text;
  v_request_id bigint;
  v_name text := btrim(coalesce(p_function_name, ''));
BEGIN
  -- Rejet AVANT toute lecture du secret Vault ou appel HTTP.
  IF v_name NOT IN (
    'weather-alerts',
    'weekly-summary',
    'send-package-reminders',
    'cleanup-404-logs',
    'resubmit-sitemap-gsc'
  ) THEN
    RAISE EXCEPTION 'cron_invoke_edge_function: target not allowed';
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'vault secret email_queue_service_role_key is missing';
  END IF;

  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/' || v_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := coalesce(p_body, '{}'::jsonb)
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

-- F-24-03 : verrous consultatifs transactionnels, un par job (libérés en fin de transaction,
-- donc jamais bloqués après crash). Si le verrou est détenu, retour contrôlé sans travail.
CREATE OR REPLACE FUNCTION public.run_dlq_retry_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_a jsonb;
  v_t jsonb;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.run_dlq_retry_cycle')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'locked');
  END IF;
  v_a := public.retry_dlq_messages('auth_emails_dlq', 'auth_emails', 24, 3, 50);
  v_t := public.retry_dlq_messages('transactional_emails_dlq', 'transactional_emails', 24, 3, 50);
  RETURN jsonb_build_object('auth', v_a, 'transactional', v_t);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_dlq_purge_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_a jsonb;
  v_t jsonb;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.run_dlq_purge_cycle')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'locked');
  END IF;
  v_a := public.purge_stale_dlq_messages('auth_emails_dlq', 7, 200);
  v_t := public.purge_stale_dlq_messages('transactional_emails_dlq', 7, 200);
  RETURN jsonb_build_object('auth', v_a, 'transactional', v_t);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_waitlist_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r record; v_n int := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.run_waitlist_cycle')) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'locked');
  END IF;

  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  FOR r IN SELECT DISTINCT date, activity FROM public.daily_waitlist
            WHERE status = 'waiting' AND date >= CURRENT_DATE
  LOOP
    PERFORM public.offer_waitlist_spot(r.date, r.activity);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'checked', v_n);
END;
$function$;

CREATE OR REPLACE FUNCTION public.run_credit_maintenance()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_exp jsonb; v_mail jsonb;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.run_credit_maintenance')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'locked');
  END IF;
  v_mail := public.enqueue_credit_expiry_notices();
  v_exp := public.expire_session_credits();
  RETURN jsonb_build_object('expired', v_exp, 'notices', v_mail);
END;
$function$;

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
  IF NOT pg_try_advisory_xact_lock(hashtext('public.purge_retention_logs')) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'locked');
  END IF;

  DELETE FROM public.analytics_events WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_analytics = ROW_COUNT;

  DELETE FROM public.public_rate_attempts WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_rate = ROW_COUNT;

  DELETE FROM public.code_access_attempts WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_code = ROW_COUNT;

  DELETE FROM public.admin_notifications
   WHERE read_at IS NOT NULL AND created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_notif = ROW_COUNT;

  -- F-23-04 : conversations assistant (questions/réponses, PII potentielle) : 90 jours.
  DELETE FROM public.assistant_conversations WHERE created_at < now() - interval '90 days';
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

  DELETE FROM public.weather_alert_subscriptions
   WHERE confirmed = false AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_weather_pending = ROW_COUNT;

  DELETE FROM public.weather_alert_subscriptions
   WHERE enabled = false AND updated_at < now() - interval '12 months';
  GET DIAGNOSTICS v_weather_off = ROW_COUNT;

  DELETE FROM public.last_minute_subscribers
   WHERE confirmed = false AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS v_lm_pending = ROW_COUNT;

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

REVOKE ALL ON FUNCTION public.cron_invoke_edge_function(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_dlq_retry_cycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_dlq_purge_cycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_waitlist_cycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_credit_maintenance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_retention_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cron_invoke_edge_function(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_dlq_retry_cycle() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_dlq_purge_cycle() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_waitlist_cycle() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_credit_maintenance() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_retention_logs() TO service_role;