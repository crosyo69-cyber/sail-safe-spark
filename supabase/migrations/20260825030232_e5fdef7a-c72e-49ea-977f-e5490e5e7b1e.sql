CREATE OR REPLACE FUNCTION public.admin_platform_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'pgmq'
AS $function$
DECLARE
  v_result jsonb;
  v_cron jsonb;
  v_queues jsonb;
  v_emails jsonb;
  v_jobid bigint;
  v_job_active boolean;
  v_last_success timestamptz;
  v_hours numeric;
  v_last_attempt_status text;
  v_last_attempt_at timestamptz;
  v_last_run_failed boolean := false;
  v_history_truncated boolean := false;
  v_backlog int;
  v_status text;
  v_message text;
  v_recent_restart boolean;
  v_cm jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT jsonb_build_object(
    'active_jobs', (SELECT count(*) FROM cron.job WHERE active),
    'total_jobs', (SELECT count(*) FROM cron.job),
    'plaintext_secret_jobs', (SELECT count(*) FROM cron.job WHERE command ~* 'eyJ[A-Za-z0-9_-]{20,}'),
    'runs_24h', (SELECT count(*) FROM cron.job_run_details WHERE start_time > now() - interval '24 hours'),
    'failures_24h', (SELECT count(*) FROM cron.job_run_details WHERE start_time > now() - interval '24 hours' AND status IS DISTINCT FROM 'succeeded'),
    'log_size', pg_size_pretty(pg_total_relation_size('cron.job_run_details')),
    'log_rows', (SELECT count(*) FROM cron.job_run_details)
  ) INTO v_cron;

  SELECT coalesce(jsonb_object_agg(q.queue_name, cnt), '{}'::jsonb) INTO v_queues
  FROM (
    SELECT m.queue_name, (SELECT count(*) FROM pgmq.metrics(m.queue_name) x WHERE true) AS ignore,
           (SELECT queue_length FROM pgmq.metrics(m.queue_name)) AS cnt
    FROM pgmq.list_queues() m
  ) q;

  SELECT jsonb_build_object(
    'sent_24h', count(*) FILTER (WHERE status = 'sent'),
    'failed_24h', count(*) FILTER (WHERE status = 'failed'),
    'dlq_24h', count(*) FILTER (WHERE status = 'dlq'),
    'rate_limited_24h', count(*) FILTER (WHERE status = 'rate_limited'),
    'error_rate_pct', CASE WHEN count(*) = 0 THEN 0
      ELSE round(100.0 * count(*) FILTER (WHERE status <> 'sent') / count(*), 2) END
  ) INTO v_emails
  FROM public.email_send_log
  WHERE created_at > now() - interval '24 hours';

  -- ── Sonde diagnostique : maintenance crédits (strictement en lecture) ──
  SELECT j.jobid, j.active INTO v_jobid, v_job_active
  FROM cron.job j
  WHERE j.jobname = 'credit-maintenance-daily'
  LIMIT 1;

  IF v_jobid IS NOT NULL THEN
    SELECT max(d.start_time) INTO v_last_success
    FROM cron.job_run_details d
    WHERE d.jobid = v_jobid AND d.status = 'succeeded';

    SELECT d.status, d.start_time INTO v_last_attempt_status, v_last_attempt_at
    FROM cron.job_run_details d
    WHERE d.jobid = v_jobid
    ORDER BY d.start_time DESC
    LIMIT 1;

    v_last_run_failed := v_last_attempt_status IS NOT NULL
      AND v_last_attempt_status IS DISTINCT FROM 'succeeded'
      AND (v_last_success IS NULL OR v_last_attempt_at > v_last_success);
  END IF;

  v_history_truncated := (v_jobid IS NOT NULL AND v_last_success IS NULL);

  IF v_last_success IS NOT NULL THEN
    v_hours := round(extract(epoch FROM (now() - v_last_success)) / 3600.0, 1);
  END IF;

  SELECT count(*) INTO v_backlog
  FROM public.session_credits
  WHERE status = 'available' AND expires_at < now();

  v_recent_restart := pg_postmaster_start_time() > now() - interval '2 hours';

  IF v_jobid IS NULL THEN
    v_status := 'danger';
    v_message := 'Le job de maintenance crédits est absent.';
  ELSIF v_job_active IS NOT TRUE THEN
    v_status := 'danger';
    v_message := 'Le job de maintenance crédits est désactivé.';
  ELSIF v_last_success IS NULL THEN
    v_status := CASE WHEN v_recent_restart THEN 'warning' ELSE 'danger' END;
    v_message := CASE WHEN v_recent_restart
      THEN 'Instance redémarrée récemment — attente de reprise du job de maintenance.'
      ELSE 'Historique cron insuffisant pour confirmer le dernier succès.' END;
  ELSIF v_hours > 72 OR (v_backlog > 0 AND v_hours > 36) THEN
    IF v_recent_restart THEN
      v_status := 'warning';
      v_message := 'Instance redémarrée récemment — attente de reprise du job de maintenance.';
    ELSE
      v_status := 'danger';
      v_message := format('Maintenance crédits non exécutée depuis %s h%s.', v_hours,
        CASE WHEN v_backlog > 0 THEN format(' — %s crédit(s) périmé(s) non traité(s)', v_backlog) ELSE '' END);
    END IF;
  ELSIF v_hours > 36 THEN
    v_status := 'warning';
    v_message := format('Maintenance crédits non exécutée depuis %s h.', v_hours);
  ELSIF v_backlog > 0 THEN
    v_status := 'warning';
    v_message := format('%s crédit(s) périmé(s) en attente de traitement.', v_backlog);
  ELSIF v_last_run_failed THEN
    v_status := 'warning';
    v_message := 'Dernière tentative de maintenance crédits en échec.';
  ELSE
    v_status := 'ok';
    v_message := 'Maintenance crédits opérationnelle.';
  END IF;

  IF v_status = 'ok' AND v_last_run_failed THEN
    v_status := 'warning';
    v_message := 'Dernière tentative de maintenance crédits en échec.';
  END IF;

  v_cm := jsonb_build_object(
    'status', v_status,
    'last_success_at', v_last_success,
    'hours_since_last_success', v_hours,
    'expired_available_count', v_backlog,
    'job_active', coalesce(v_job_active, false),
    'last_run_failed', v_last_run_failed,
    'history_truncated', v_history_truncated,
    'message', v_message
  );

  v_result := jsonb_build_object(
    'generated_at', now(),
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'cron', v_cron,
    'queues', v_queues,
    'emails', v_emails,
    'credit_maintenance', v_cm
  );

  RETURN v_result;
END;
$function$;