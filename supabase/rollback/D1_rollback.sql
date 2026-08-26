-- Rollback LOT D-1 — restaure les EXECUTE publics retirés par la migration D-1.
-- Ne restaure PAS le grant à PUBLIC de façon distincte : les rôles anon/authenticated
-- couvrent l'exposition API réellement observée avant D-1.

-- D-1 / R1
GRANT EXECUTE ON FUNCTION public.book_daily_visitor(date, activity_type, text, text, text, text, integer, text, text) TO anon, authenticated;

-- D-1 / R2 (cycle / maintenance)
GRANT EXECUTE ON FUNCTION public.find_or_create_daily_group(date, activity_type, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_dlq_purge_cycle() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_stale_dlq_messages(text, integer, integer) TO anon, authenticated;

-- D-1 / R2 (fonctions de trigger)
GRANT EXECUTE ON FUNCTION public.ensure_crm_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_new_reservation() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mint_credits_on_package_created() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_daily_group_capacity() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_package_booking_created_dg() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_spot_freed_notify_waitlist() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_marketing_consent_to_crm() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_session_credits_on_booking() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_session_credits_on_history() TO anon, authenticated;
