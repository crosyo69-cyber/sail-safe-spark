ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_session_id_fkey;
ALTER TABLE public.package_bookings DROP CONSTRAINT IF EXISTS package_bookings_session_id_fkey;
ALTER TABLE public.reservations DROP COLUMN IF EXISTS session_id;
ALTER TABLE public.package_bookings DROP COLUMN IF EXISTS session_id;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.daily_slot_capacity CASCADE;
DROP TYPE IF EXISTS public.time_slot CASCADE;