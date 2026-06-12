-- Restore full-table publication so UPDATEs on sensitive columns aren't blocked
ALTER PUBLICATION supabase_realtime DROP TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;

-- Keep anon column-level SELECT revoke as defense in depth (idempotent)
REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM anon;