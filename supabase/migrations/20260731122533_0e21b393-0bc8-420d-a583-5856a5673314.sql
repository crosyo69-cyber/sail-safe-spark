-- ============================================================
-- LOT 0.1 — Rétention des journaux cron
-- ============================================================
CREATE UNLOGGED TABLE public._cron_run_details_keep AS
SELECT * FROM cron.job_run_details
WHERE start_time > now() - interval '7 days'
   OR (status IS DISTINCT FROM 'succeeded' AND start_time > now() - interval '30 days');

TRUNCATE cron.job_run_details;

INSERT INTO cron.job_run_details SELECT * FROM public._cron_run_details_keep;

DROP TABLE public._cron_run_details_keep;

CREATE OR REPLACE FUNCTION public.purge_cron_run_details(
  p_success_retention_days int DEFAULT 7,
  p_error_retention_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
DECLARE
  v_success int;
  v_error int;
BEGIN
  DELETE FROM cron.job_run_details
  WHERE status = 'succeeded'
    AND start_time < now() - make_interval(days => p_success_retention_days);
  GET DIAGNOSTICS v_success = ROW_COUNT;

  DELETE FROM cron.job_run_details
  WHERE status IS DISTINCT FROM 'succeeded'
    AND start_time < now() - make_interval(days => p_error_retention_days);
  GET DIAGNOSTICS v_error = ROW_COUNT;

  RETURN jsonb_build_object('deleted_success', v_success, 'deleted_error', v_error, 'at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.purge_cron_run_details(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_cron_run_details(int, int) TO service_role;

SELECT cron.schedule('purge-cron-run-details-daily', '25 3 * * *', $$SELECT public.purge_cron_run_details();$$);

-- ============================================================
-- LOT 0.2 — Durcissement des SECURITY DEFINER critiques
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.enqueue_booking_confirmation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_low_credit_warning(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_day_cancelled_notification(text, text, text, date, text, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_reschedule_notification(text, text, text, text, date, date, text) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_marketing_segment(jsonb, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marketing_segment_estimate(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marketing_segment_base() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- LOT 0.3 — Plus aucun JWT service_role en clair dans cron.job
-- ============================================================
CREATE OR REPLACE FUNCTION public.cron_invoke_edge_function(
  p_function_name text,
  p_body jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net, vault
AS $$
DECLARE
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'vault secret email_queue_service_role_key is missing';
  END IF;

  SELECT net.http_post(
    url := 'https://unqxudbxxzzmmbwwxwcr.supabase.co/functions/v1/' || p_function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := coalesce(p_body, '{}'::jsonb)
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_invoke_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_invoke_edge_function(text, jsonb) TO service_role;

SELECT cron.alter_job(8,  command => $$SELECT public.cron_invoke_edge_function('weather-alerts', '{}'::jsonb);$$);
SELECT cron.alter_job(9,  command => $$SELECT public.cron_invoke_edge_function('weekly-summary', '{}'::jsonb);$$);
SELECT cron.alter_job(10, command => $$SELECT public.cron_invoke_edge_function('cleanup-404-logs', '{"source":"cron"}'::jsonb);$$);
SELECT cron.alter_job(11, command => $$SELECT public.cron_invoke_edge_function('send-package-reminders', '{}'::jsonb);$$);
SELECT cron.alter_job(12, command => $$SELECT public.cron_invoke_edge_function('resubmit-sitemap-gsc', jsonb_build_object('trigger','cron'));$$);