SELECT net.http_post(
  url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/sync-brevo-contacts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (regexp_match(
      (SELECT command FROM cron.job WHERE jobname = 'weather-alerts-hourly' LIMIT 1),
      'Bearer ([A-Za-z0-9._-]+)'
    ))[1]
  ),
  body := '{"action":"cleanup_test"}'::jsonb
);