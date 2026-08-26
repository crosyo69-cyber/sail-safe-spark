-- D1_revoke_public_execution.sql (complement)
-- REVOKE ONLY — no business logic change.
REVOKE EXECUTE ON FUNCTION public.offer_waitlist_spot(date, activity_type) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_waitlist_cycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offer_waitlist_spot(date, activity_type) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_waitlist_cycle() TO service_role;