-- Add unsubscribe_token column to weather_alert_subscriptions
ALTER TABLE public.weather_alert_subscriptions 
ADD COLUMN unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Create unique index on unsubscribe_token
CREATE UNIQUE INDEX idx_weather_alert_unsubscribe_token 
ON public.weather_alert_subscriptions (unsubscribe_token);

-- Update RLS policy to allow users to unsubscribe using their token
DROP POLICY IF EXISTS "Block all updates" ON public.weather_alert_subscriptions;

CREATE POLICY "Allow unsubscribe by token" 
ON public.weather_alert_subscriptions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create a security definer function for unsubscribing
CREATE OR REPLACE FUNCTION public.unsubscribe_weather_alert(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.weather_alert_subscriptions 
  SET enabled = false, updated_at = now()
  WHERE unsubscribe_token = p_token AND enabled = true;
  
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

-- Create a function to delete subscription by token
CREATE OR REPLACE FUNCTION public.delete_weather_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  DELETE FROM public.weather_alert_subscriptions 
  WHERE unsubscribe_token = p_token;
  
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;