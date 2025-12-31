-- Revoke public execute permissions on weather alert RPC functions
-- This forces all operations through the Edge Function for proper rate limiting and logging

-- Revoke from unsubscribe_weather_alert
REVOKE EXECUTE ON FUNCTION public.unsubscribe_weather_alert(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unsubscribe_weather_alert(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unsubscribe_weather_alert(uuid) FROM authenticated;

-- Revoke from delete_weather_subscription
REVOKE EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) FROM authenticated;

-- Grant only to service_role (used by Edge Functions with service role key)
GRANT EXECUTE ON FUNCTION public.unsubscribe_weather_alert(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_weather_subscription(uuid) TO service_role;