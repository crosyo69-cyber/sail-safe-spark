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
  ELSIF v_purpose = 'weather_unsubscribe' THEN
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

REVOKE EXECUTE ON FUNCTION public.issue_link_token(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_link_token(text, text, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_weather_subscription(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count integer; v_subject text; v_ids uuid[];
BEGIN
  v_subject := public.resolve_link_token('weather_unsubscribe', p_token);

  WITH deleted AS (
    DELETE FROM public.weather_alert_subscriptions
     WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
        OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text))
    RETURNING id
  )
  SELECT array_agg(id) INTO v_ids FROM deleted;

  v_count := COALESCE(array_length(v_ids, 1), 0);

  IF v_count > 0 THEN
    UPDATE public.public_link_tokens
       SET revoked_at = now()
     WHERE purpose = 'weather_unsubscribe'
       AND revoked_at IS NULL
       AND subject_id = ANY (SELECT unnest(v_ids)::text);
  END IF;

  RETURN v_count > 0;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.purge_expired_link_tokens()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_expired integer := 0; v_revoked integer := 0; v_orphan integer := 0;
BEGIN
  DELETE FROM public.public_link_tokens
   WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;

  DELETE FROM public.public_link_tokens
   WHERE revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days';
  GET DIAGNOSTICS v_revoked = ROW_COUNT;

  DELETE FROM public.public_link_tokens t
   WHERE t.purpose = 'weather_unsubscribe'
     AND NOT EXISTS (
       SELECT 1 FROM public.weather_alert_subscriptions w
        WHERE w.id::text = t.subject_id
     );
  GET DIAGNOSTICS v_orphan = ROW_COUNT;

  RETURN jsonb_build_object(
    'expired_deleted', v_expired,
    'revoked_deleted', v_revoked,
    'orphan_deleted', v_orphan
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_link_tokens() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_link_tokens() TO service_role;

SELECT cron.unschedule('purge-link-tokens-daily')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-link-tokens-daily');

SELECT cron.schedule('purge-link-tokens-daily', '40 3 * * *', $$SELECT public.purge_expired_link_tokens();$$);
