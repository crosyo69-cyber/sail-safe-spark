CREATE OR REPLACE FUNCTION public.unsubscribe_weather_alert(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count integer; v_subject text;
BEGIN
  v_subject := public.resolve_link_token('weather_unsubscribe', p_token);

  UPDATE public.weather_alert_subscriptions
     SET enabled = false, updated_at = now()
   WHERE enabled = true
     AND ((v_subject IS NOT NULL AND id = v_subject::uuid)
       OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text)));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_weather_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count integer; v_subject text;
BEGIN
  v_subject := public.resolve_link_token('weather_unsubscribe', p_token);

  DELETE FROM public.weather_alert_subscriptions
   WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
      OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text));

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_weather_alert(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_weather_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_weather_alert(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) TO service_role;