-- E0-01 : retrait des privilèges d'écriture anon (aucune policy modifiée)
REVOKE INSERT, UPDATE, DELETE ON public.client_packages FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.reservations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.package_bookings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.credit_audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.credit_reminder_preferences FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.email_send_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.email_send_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.admin_notifications FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.daily_groups FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
-- page_404_logs : INSERT anon conservé (chemin légitime NotFound.tsx)
REVOKE UPDATE, DELETE ON public.page_404_logs FROM anon;

-- E0-02 : RPC admin — retrait EXECUTE à PUBLIC et anon (authenticated/service_role conservés)
REVOKE EXECUTE ON FUNCTION public.admin_cancel_daily_group(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_day(date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_credit_audit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_credit_stats(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_extend_credit(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_credits(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_daily_groups(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_daily_groups_range(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_move_group_member(text, uuid, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reactivate_credit(uuid, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_remove_group_member(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reschedule_booking(text, uuid, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_search_wallets(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_daily_group(uuid, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_package_credits(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_group_and_recredit(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_cancel_daily_group(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_cancel_day(date, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_credit_audit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_credit_stats(date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_extend_credit(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_credits(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_daily_groups(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_daily_groups_range(date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_move_group_member(text, uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_credit(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_remove_group_member(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reschedule_booking(text, uuid, date, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_search_wallets(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_daily_group(uuid, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_package_credits(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_cancel_group_and_recredit(uuid, text) TO authenticated, service_role;

-- E0-03 : marketing_automations_due réservée aux traitements internes
REVOKE EXECUTE ON FUNCTION public.marketing_automations_due() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_automations_due() TO service_role;