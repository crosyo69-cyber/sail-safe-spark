-- D-1 / R1 : public EXECUTE removed from book_daily_visitor
REVOKE EXECUTE ON FUNCTION public.book_daily_visitor(date, activity_type, text, text, text, text, integer, text, text) FROM PUBLIC, anon, authenticated;

-- D-1 / R2 : public EXECUTE removed from cycle/maintenance functions
REVOKE EXECUTE ON FUNCTION public.find_or_create_daily_group(date, activity_type, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_dlq_purge_cycle() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purge_stale_dlq_messages(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- D-1 / R2 : public EXECUTE removed from trigger-only functions
REVOKE EXECUTE ON FUNCTION public.ensure_crm_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_reservation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mint_credits_on_package_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_daily_group_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_package_booking_created_dg() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_spot_freed_notify_waitlist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_marketing_consent_to_crm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_session_credits_on_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_session_credits_on_history() FROM PUBLIC, anon, authenticated;