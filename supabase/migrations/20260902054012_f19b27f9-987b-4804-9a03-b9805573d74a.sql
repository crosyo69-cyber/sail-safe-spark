-- F-12-01 : retrait des privilèges table-level inutiles pour authenticated
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON
  public.user_roles, public.session_credits, public.client_packages,
  public.reservations, public.crm_client_profiles, public.package_bookings,
  public.email_send_log, public.admin_notifications,
  public.assistant_conversations, public.marketing_preferences
FROM authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.session_credits FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.crm_client_profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.package_bookings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.email_send_log FROM authenticated;
REVOKE INSERT, DELETE ON public.client_packages FROM authenticated;
REVOKE INSERT, DELETE ON public.reservations FROM authenticated;
REVOKE INSERT ON public.admin_notifications FROM authenticated;
REVOKE INSERT ON public.assistant_conversations FROM authenticated;

-- F-12-02 : suppression de l'oracle public has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;