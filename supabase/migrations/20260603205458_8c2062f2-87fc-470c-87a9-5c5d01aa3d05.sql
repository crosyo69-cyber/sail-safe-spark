-- Remove tables containing PII or sensitive analytics from the Realtime publication.
-- Realtime postgres_changes broadcasts row payloads to every channel subscriber
-- regardless of the source table's RLS, so the only safe fix is to stop publishing them.
ALTER PUBLICATION supabase_realtime DROP TABLE public.reservations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.package_bookings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.analytics_events;
-- public.sessions remains in the publication: no PII, needed for live availability refresh.