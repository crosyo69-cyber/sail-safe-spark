CREATE OR REPLACE FUNCTION public.get_latest_auth_email_status(p_email text)
RETURNS TABLE(status text, last_event_at timestamptz, error_message text, template_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status, created_at AS last_event_at, error_message, template_name
  FROM public.email_send_log
  WHERE lower(recipient_email) = lower(p_email)
  ORDER BY created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_latest_auth_email_status(text) TO anon, authenticated;