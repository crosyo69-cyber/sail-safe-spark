CREATE OR REPLACE FUNCTION public.admin_platform_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron, pgmq
AS $$
DECLARE
  v_result jsonb;
  v_cron jsonb;
  v_queues jsonb;
  v_emails jsonb;
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

  v_result := jsonb_build_object(
    'generated_at', now(),
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'cron', v_cron,
    'queues', v_queues,
    'emails', v_emails
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_platform_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_health() TO authenticated, service_role;