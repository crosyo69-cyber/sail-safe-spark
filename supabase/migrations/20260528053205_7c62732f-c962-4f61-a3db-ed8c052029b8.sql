
CREATE OR REPLACE VIEW public.pgmq_queue_status AS
SELECT queue_name, queue_length::bigint, oldest_msg_age_sec::bigint, total_messages
FROM pgmq.metrics_all();

GRANT SELECT ON public.pgmq_queue_status TO service_role;

CREATE OR REPLACE VIEW public.cron_job_status AS
SELECT jobid, jobname, schedule, active FROM cron.job;

GRANT SELECT ON public.cron_job_status TO service_role;

DO $$
DECLARE v_id bigint;
BEGIN
  SELECT jobid INTO v_id FROM cron.job WHERE jobname = 'email-queue-health-check';
  IF v_id IS NOT NULL THEN PERFORM cron.unschedule(v_id); END IF;
END $$;

SELECT cron.schedule(
  'email-queue-health-check',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/email-queue-health-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
