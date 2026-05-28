
DROP VIEW IF EXISTS public.pgmq_queue_status;

CREATE OR REPLACE FUNCTION public.get_email_queue_status()
RETURNS TABLE(queue_name text, queue_length bigint, oldest_msg_age_sec bigint, total_messages bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
  SELECT queue_name, queue_length::bigint, oldest_msg_age_sec::bigint, total_messages::bigint
  FROM pgmq.metrics_all();
$$;

REVOKE ALL ON FUNCTION public.get_email_queue_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_queue_status() TO service_role;
