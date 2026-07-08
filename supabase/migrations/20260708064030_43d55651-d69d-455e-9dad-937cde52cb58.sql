
-- Retry DLQ messages back into their live queue, with retry cap and age limit
CREATE OR REPLACE FUNCTION public.retry_dlq_messages(
  p_dlq text,
  p_target text,
  p_max_age_hours int DEFAULT 24,
  p_max_retries int DEFAULT 3,
  p_limit int DEFAULT 50
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_rec record;
  v_payload jsonb;
  v_retry_count int;
  v_requeued int := 0;
  v_skipped int := 0;
  v_purged int := 0;
BEGIN
  FOR v_rec IN
    SELECT msg_id, enqueued_at, message
      FROM pgmq.read(p_dlq, 30, p_limit)
  LOOP
    v_payload := v_rec.message;
    v_retry_count := COALESCE((v_payload->>'dlq_retry_count')::int, 0);

    IF v_rec.enqueued_at < now() - make_interval(hours => p_max_age_hours) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF v_retry_count >= p_max_retries THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_payload := v_payload
      || jsonb_build_object(
        'dlq_retry_count', v_retry_count + 1,
        'dlq_last_retry_at', to_jsonb(now())
      );

    PERFORM pgmq.send(p_target, v_payload);
    PERFORM pgmq.delete(p_dlq, v_rec.msg_id);
    v_requeued := v_requeued + 1;
  END LOOP;

  -- Wake the email processor if we requeued anything
  IF v_requeued > 0 AND p_target IN ('auth_emails','transactional_emails') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue') THEN
      BEGIN
        PERFORM cron.schedule('process-email-queue', '5 seconds',
          $cron$ SELECT public.email_queue_dispatch(); $cron$);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'retry_dlq_messages: cron schedule failed: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'dlq', p_dlq,
    'target', p_target,
    'requeued', v_requeued,
    'skipped', v_skipped,
    'purged', v_purged
  );
END;
$$;

-- Purge stale DLQ messages older than N days
CREATE OR REPLACE FUNCTION public.purge_stale_dlq_messages(
  p_dlq text,
  p_max_age_days int DEFAULT 7,
  p_limit int DEFAULT 200
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
DECLARE
  v_rec record;
  v_purged int := 0;
BEGIN
  FOR v_rec IN
    SELECT msg_id, enqueued_at
      FROM pgmq.read(p_dlq, 30, p_limit)
  LOOP
    IF v_rec.enqueued_at < now() - make_interval(days => p_max_age_days) THEN
      PERFORM pgmq.delete(p_dlq, v_rec.msg_id);
      v_purged := v_purged + 1;
    END IF;
  END LOOP;

  IF v_purged > 0 THEN
    PERFORM public.enqueue_admin_notification(
      'dlq_purge', 'info',
      'Purge DLQ — ' || p_dlq,
      v_purged::text || ' message(s) supprimé(s) de la DLQ (plus de ' || p_max_age_days || ' jours)',
      jsonb_build_object('dlq', p_dlq, 'purged', v_purged),
      'dlq_purge:' || p_dlq || ':' || to_char(now(),'YYYY-MM-DD')
    );
  END IF;

  RETURN jsonb_build_object('dlq', p_dlq, 'purged', v_purged);
END;
$$;

-- Wrapper that runs the full DLQ maintenance cycle for both queues
CREATE OR REPLACE FUNCTION public.run_dlq_retry_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a jsonb;
  v_t jsonb;
BEGIN
  v_a := public.retry_dlq_messages('auth_emails_dlq', 'auth_emails', 24, 3, 50);
  v_t := public.retry_dlq_messages('transactional_emails_dlq', 'transactional_emails', 24, 3, 50);
  RETURN jsonb_build_object('auth', v_a, 'transactional', v_t);
END;
$$;

CREATE OR REPLACE FUNCTION public.run_dlq_purge_cycle()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_a jsonb;
  v_t jsonb;
BEGIN
  v_a := public.purge_stale_dlq_messages('auth_emails_dlq', 7, 200);
  v_t := public.purge_stale_dlq_messages('transactional_emails_dlq', 7, 200);
  RETURN jsonb_build_object('auth', v_a, 'transactional', v_t);
END;
$$;

-- Schedule: retry hourly, purge daily at 03:15 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dlq-retry-hourly') THEN
    PERFORM cron.unschedule('dlq-retry-hourly');
  END IF;
  PERFORM cron.schedule(
    'dlq-retry-hourly',
    '7 * * * *',
    $cron$ SELECT public.run_dlq_retry_cycle(); $cron$
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dlq-purge-daily') THEN
    PERFORM cron.unschedule('dlq-purge-daily');
  END IF;
  PERFORM cron.schedule(
    'dlq-purge-daily',
    '15 3 * * *',
    $cron$ SELECT public.run_dlq_purge_cycle(); $cron$
  );
END $$;

GRANT EXECUTE ON FUNCTION public.retry_dlq_messages(text, text, int, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_stale_dlq_messages(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_dlq_retry_cycle() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_dlq_purge_cycle() TO service_role;
