-- Fix overly permissive RLS policy on weather_alert_subscriptions
-- The current "Allow unsubscribe by token" policy uses USING (true) WITH CHECK (true)
-- which allows anyone to update any row. Since all updates go through 
-- service_role-protected RPC functions (unsubscribe_weather_alert, delete_weather_subscription),
-- we should block all direct UPDATE access.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow unsubscribe by token" ON public.weather_alert_subscriptions;

-- Create a restrictive policy that blocks all direct UPDATE access
-- All legitimate updates go through the SECURITY DEFINER RPC functions
CREATE POLICY "Block all direct updates" 
ON public.weather_alert_subscriptions 
FOR UPDATE 
USING (false)
WITH CHECK (false);