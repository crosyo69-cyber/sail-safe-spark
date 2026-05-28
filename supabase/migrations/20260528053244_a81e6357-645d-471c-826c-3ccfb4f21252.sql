
ALTER VIEW public.pgmq_queue_status SET (security_invoker = true);
ALTER VIEW public.cron_job_status SET (security_invoker = true);
