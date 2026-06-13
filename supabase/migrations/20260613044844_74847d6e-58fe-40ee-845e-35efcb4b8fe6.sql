REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM anon;
REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM authenticated;
GRANT SELECT (notes, weather_note, cancellation_reason) ON public.sessions TO service_role;