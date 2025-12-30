-- Drop ALL remaining permissive RLS policies on weather_alert_subscriptions
DROP POLICY IF EXISTS "Anyone can create a subscription" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can view subscriptions" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can update their subscription" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete their subscription" ON public.weather_alert_subscriptions;

-- Re-create secure policies
-- Only service role (edge function) can read emails for weather alerts sending
DROP POLICY IF EXISTS "Service can read subscriptions for weather alerts" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Users can create their own weather alert subscription" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "No direct updates allowed" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "No direct deletes allowed" ON public.weather_alert_subscriptions;

-- Allow inserting new subscriptions (public form)
CREATE POLICY "Public can subscribe to weather alerts" 
ON public.weather_alert_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Block SELECT from anonymous/authenticated users (only service role can read)
CREATE POLICY "Only service role can read subscriptions" 
ON public.weather_alert_subscriptions 
FOR SELECT 
USING (false);

-- Block UPDATE from all users 
CREATE POLICY "Block all updates" 
ON public.weather_alert_subscriptions 
FOR UPDATE 
USING (false);

-- Block DELETE from all users
CREATE POLICY "Block all deletes" 
ON public.weather_alert_subscriptions 
FOR DELETE 
USING (false);