REVOKE EXECUTE ON FUNCTION public.confirm_weather_subscription(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_weather_subscription(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.weather_alert_claim_batch(integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.weather_alert_claim_batch(integer, integer) FROM anon;