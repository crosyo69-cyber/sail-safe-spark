
ALTER VIEW public.pgmq_queue_status SET (security_invoker = false);
ALTER VIEW public.cron_job_status SET (security_invoker = false);
REVOKE ALL ON public.pgmq_queue_status FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.cron_job_status FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pgmq_queue_status TO service_role;
GRANT SELECT ON public.cron_job_status TO service_role;
