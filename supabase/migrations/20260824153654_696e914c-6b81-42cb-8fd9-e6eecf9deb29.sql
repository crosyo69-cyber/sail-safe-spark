CREATE UNIQUE INDEX uq_client_packages_stripe_session_id
ON public.client_packages (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX uq_email_send_log_pending_message_id
ON public.email_send_log (message_id)
WHERE status = 'pending';