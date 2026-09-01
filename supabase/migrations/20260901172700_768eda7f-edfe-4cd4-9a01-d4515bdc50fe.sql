CREATE OR REPLACE FUNCTION public.purge_retention_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

  -- email_send_log : anonymisation deterministe > 90 jours.
  -- Les lignes 'pending' de plus de 90 jours ne sont plus exclues : elles ne
  -- peuvent plus correspondre a un envoi en cours (TTL file = minutes) et
  -- echappaient donc indument a la politique de retention. Seul 'processing'
  -- reste protege. Durees inchangees.
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
    'email_send_log_deleted', v_email_del
  );
END;
$fn$;