REVOKE SELECT (notes) ON public.daily_groups FROM PUBLIC;
REVOKE SELECT (notes) ON public.daily_groups FROM anon;
REVOKE SELECT (notes) ON public.daily_groups FROM authenticated;
GRANT SELECT (notes) ON public.daily_groups TO service_role;