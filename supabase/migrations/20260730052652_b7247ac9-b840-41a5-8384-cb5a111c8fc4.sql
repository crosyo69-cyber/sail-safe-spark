SELECT cron.unschedule('sync-stripe-reservations-every-15min');
SELECT cron.unschedule('sync-stripe-reservations-hourly');

SELECT cron.schedule(
  'sync-stripe-reservations-every-15min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/sync-stripe-reservations?days=7',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('trigger','cron','ts', now())
  );
  $cron$
);

SELECT cron.schedule(
  'sync-stripe-reservations-hourly',
  '7 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/sync-stripe-reservations?days=7',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := jsonb_build_object('trigger','cron','ts', now())
  );
  $cron$
);