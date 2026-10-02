-- LOT E-4-A : user_roles
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;

-- LOT E-4-B : privilèges résiduels anon
REVOKE UPDATE, DELETE ON public.analytics_events FROM anon;
REVOKE UPDATE, DELETE ON public.session_credits FROM anon;
REVOKE UPDATE, DELETE ON public.session_generation_runs FROM anon;
REVOKE UPDATE, DELETE ON public.suppressed_emails FROM anon;
REVOKE UPDATE, DELETE ON public.weather_alert_subscriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.blog_comments FROM anon;
REVOKE DELETE ON public.daily_waitlist FROM anon;
REVOKE INSERT ON public.package_credit_history FROM anon;