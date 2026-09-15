-- F-25-N / F-14 : rétention des données d'authentification temporaire.
-- Extension de la tâche de maintenance quotidienne EXISTANTE (purge_retention_logs,
-- cron "retention-logs-purge-daily"). Aucun nouveau cron, aucune nouvelle table.
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
  v_otp_sessions int := 0;
  v_otp_challenges int := 0;
  v_email_claims int := 0;
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

  -- F-25-N.2 : sessions OTP terminées depuis plus de 30 jours.
  -- Une session ACTIVE (absolute_expires_at >= now()) et non révoquée n'est
  -- jamais concernée : les deux branches exigent un horodatage passé de +30 jours.
  DELETE FROM public.otp_sessions
   WHERE (absolute_expires_at < now() - interval '30 days')
      OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days');
  GET DIAGNOSTICS v_otp_sessions = ROW_COUNT;

  -- F-25-N.1 : challenges OTP expirés depuis plus de 30 jours (TTL nominal 10 min).
  -- otp_sessions.challenge_id est ON DELETE SET NULL : aucune session n'est perdue.
  DELETE FROM public.otp_challenges
   WHERE expires_at < now() - interval '30 days';
  GET DIAGNOSTICS v_otp_challenges = ROW_COUNT;

  -- F-14 : purge des baux d'envoi d'e-mail périmés (fonction existante, désormais
  -- planifiée via cette tâche de maintenance ; bail nominal = 120 s, seuil = 1 jour).
  v_email_claims := public.purge_expired_email_claims();

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
    'waitlist_finished_deleted', v_waitlist,
    'otp_sessions_deleted', v_otp_sessions,
    'otp_challenges_deleted', v_otp_challenges,
    'email_send_claims_deleted', v_email_claims
  );
END;
$function$;