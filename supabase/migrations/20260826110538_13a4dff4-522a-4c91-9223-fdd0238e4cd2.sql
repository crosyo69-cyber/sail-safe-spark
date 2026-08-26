-- D-4-FIX-3 : suppression définitive des tokens publics en clair (R5 phase C)

-- 12.1 Retrait des DEFAULT
ALTER TABLE public.daily_waitlist ALTER COLUMN offer_token DROP DEFAULT;
ALTER TABLE public.last_minute_subscribers ALTER COLUMN confirm_token DROP DEFAULT;
ALTER TABLE public.last_minute_subscribers ALTER COLUMN unsubscribe_token DROP DEFAULT;
ALTER TABLE public.marketing_preferences ALTER COLUMN token DROP DEFAULT;
ALTER TABLE public.weather_alert_subscriptions ALTER COLUMN unsubscribe_token DROP DEFAULT;

-- 12.2 Suppression des triggers de synchronisation et de leurs fonctions
DROP TRIGGER IF EXISTS trg_waitlist_token_hash ON public.daily_waitlist;
DROP TRIGGER IF EXISTS trg_last_minute_token_hash ON public.last_minute_subscribers;
DROP TRIGGER IF EXISTS trg_marketing_token_hash ON public.marketing_preferences;
DROP TRIGGER IF EXISTS trg_weather_token_hash ON public.weather_alert_subscriptions;

DROP FUNCTION IF EXISTS public.sync_waitlist_token_hash();
DROP FUNCTION IF EXISTS public.sync_last_minute_token_hash();
DROP FUNCTION IF EXISTS public.sync_marketing_token_hash();
DROP FUNCTION IF EXISTS public.sync_weather_token_hash();

-- 12.4 DROP des colonnes en clair (les *_token_hash legacy sont conservés)
ALTER TABLE public.daily_waitlist DROP COLUMN offer_token;
ALTER TABLE public.last_minute_subscribers DROP COLUMN confirm_token;
ALTER TABLE public.last_minute_subscribers DROP COLUMN unsubscribe_token;
ALTER TABLE public.marketing_preferences DROP COLUMN token;
ALTER TABLE public.weather_alert_subscriptions DROP COLUMN unsubscribe_token;