-- lovable-cron-fallback-reviewed: 17280 runs/day; no new job created — re-creating the existing dispatcher helper whose 5-second schedule is wake-on-enqueue and self-unschedules when both email queues drain.
CREATE OR REPLACE FUNCTION public.issue_link_token(p_purpose text, p_subject_id text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_token uuid; v_purpose text; v_expires timestamptz;
BEGIN
  IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
    RAISE EXCEPTION 'purpose_required';
  END IF;
  IF p_subject_id IS NULL OR btrim(p_subject_id) = '' THEN
    RAISE EXCEPTION 'subject_required';
  END IF;

  v_purpose := btrim(p_purpose);

  IF p_expires_at IS NOT NULL THEN
    v_expires := p_expires_at;
  ELSIF v_purpose IN ('weather_unsubscribe', 'last_minute_confirm', 'last_minute_unsubscribe') THEN
    v_expires := now() + interval '12 months';
  ELSE
    v_expires := NULL;
  END IF;

  v_token := gen_random_uuid();

  INSERT INTO public.public_link_tokens (purpose, subject_id, token_hash, expires_at)
  VALUES (v_purpose, btrim(p_subject_id),
          public.code_access_hash(v_token::text), v_expires);

  RETURN v_token::text;
END;
$function$;

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
        'dlq_last_retry_at', to_jsonb(now()),
        'queued_at', to_jsonb(now())
      );

    PERFORM pgmq.send(p_target, v_payload);
    PERFORM pgmq.delete(p_dlq, v_rec.msg_id);
    v_requeued := v_requeued + 1;
  END LOOP;

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
    'requeued', v_requeued,
    'skipped', v_skipped
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.retry_dlq_messages(text, text, int, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retry_dlq_messages(text, text, int, int, int) TO service_role;