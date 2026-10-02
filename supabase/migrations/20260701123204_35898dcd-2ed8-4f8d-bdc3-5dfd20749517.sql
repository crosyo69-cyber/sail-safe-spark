
-- Ensure old job (if any variant) is removed before re-creating
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $CRON$
  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
    ),
    body := '{"source":"pg_cron"}'::jsonb
  );
  $CRON$
);
