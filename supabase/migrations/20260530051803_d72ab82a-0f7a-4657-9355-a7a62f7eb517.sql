-- Restrict get_latest_auth_email_status to authenticated users querying their own email
REVOKE EXECUTE ON FUNCTION public.get_latest_auth_email_status(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_auth_email_status(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_latest_auth_email_status(p_email text)
 RETURNS TABLE(status text, last_event_at timestamp with time zone, error_message text, template_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT status, created_at AS last_event_at, error_message, template_name
  FROM public.email_send_log
  WHERE lower(recipient_email) = lower(p_email)
    AND auth.email() IS NOT NULL
    AND lower(p_email) = lower(auth.email())
  ORDER BY created_at DESC
  LIMIT 1;
$function$;