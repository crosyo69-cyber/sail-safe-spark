CREATE OR REPLACE FUNCTION public.unsubscribe_weather_alert(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.weather_alert_subscriptions
  SET enabled = false, updated_at = now()
  WHERE unsubscribe_token_hash = public.code_access_hash(p_token::text) AND enabled = true;

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_weather_subscription(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_found boolean;
BEGIN
  DELETE FROM public.weather_alert_subscriptions
  WHERE unsubscribe_token_hash = public.code_access_hash(p_token::text);

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$function$;