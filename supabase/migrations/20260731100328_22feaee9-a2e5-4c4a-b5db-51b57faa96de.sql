SELECT net.http_post(
  url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/sync-brevo-contacts',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
  ),
  body := '{"action":"cleanup_test"}'::jsonb
);