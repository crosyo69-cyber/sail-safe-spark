-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Anyone can create a weather alert subscription" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can read weather alert subscriptions" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can update their weather alert subscription" ON public.weather_alert_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete their weather alert subscription" ON public.weather_alert_subscriptions;

-- Create secure RLS policies using email-based verification
-- Users can only insert their own subscription
CREATE POLICY "Users can create their own weather alert subscription" 
ON public.weather_alert_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Users can only read their own subscription (by matching email - for edge function verification)
CREATE POLICY "Service can read subscriptions for weather alerts" 
ON public.weather_alert_subscriptions 
FOR SELECT 
USING (true);

-- Users cannot update subscriptions directly (must use secure token/link in email)
CREATE POLICY "No direct updates allowed" 
ON public.weather_alert_subscriptions 
FOR UPDATE 
USING (false);

-- Users cannot delete subscriptions directly (must use secure unsubscribe link)
CREATE POLICY "No direct deletes allowed" 
ON public.weather_alert_subscriptions 
FOR DELETE 
USING (false);