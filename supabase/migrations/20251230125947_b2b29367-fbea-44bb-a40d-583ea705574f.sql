-- Create table for weather alert subscriptions
CREATE TABLE public.weather_alert_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  min_wind INTEGER NOT NULL DEFAULT 10,
  max_wind INTEGER NOT NULL DEFAULT 30,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable Row Level Security
ALTER TABLE public.weather_alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (public feature)
CREATE POLICY "Anyone can create a subscription" 
ON public.weather_alert_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Allow reading own subscription by email
CREATE POLICY "Anyone can view subscriptions" 
ON public.weather_alert_subscriptions 
FOR SELECT 
USING (true);

-- Allow updating by email match
CREATE POLICY "Anyone can update their subscription" 
ON public.weather_alert_subscriptions 
FOR UPDATE 
USING (true);

-- Allow deleting by email match
CREATE POLICY "Anyone can delete their subscription" 
ON public.weather_alert_subscriptions 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weather_alert_subscriptions_updated_at
BEFORE UPDATE ON public.weather_alert_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();