CREATE OR REPLACE FUNCTION public.get_payment_booking_status(p_stripe_session_id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only an opaque Stripe checkout reference is accepted; no customer data
  -- or payment metadata is exposed to anonymous checkout visitors.
  IF p_stripe_session_id IS NULL OR p_stripe_session_id !~ '^cs_(live|test)_[A-Za-z0-9]{20,255}$' THEN
    RETURN 'pending';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reservations
             WHERE stripe_session_id = p_stripe_session_id AND status = 'confirmed') THEN
    RETURN 'confirmed';
  END IF;

  -- A Stage pack alone is not proof: every participant must have all five
  -- confirmed daily bookings. Other packs are confirmed via reservations.
  IF EXISTS (SELECT 1 FROM public.client_packages
             WHERE stripe_session_id = p_stripe_session_id
               AND activity = 'stage_100_glisse' AND participant_index IS NOT NULL)
     AND NOT EXISTS (
       SELECT 1 FROM public.client_packages cp
       WHERE cp.stripe_session_id = p_stripe_session_id
         AND (cp.activity <> 'stage_100_glisse' OR cp.participant_index IS NULL
              OR cp.status <> 'active' OR cp.deposit_paid_at IS NULL
              OR (SELECT count(DISTINCT pb.daily_group_id)
                  FROM public.package_bookings pb
                  WHERE pb.package_id = cp.id AND pb.status = 'confirmed') <> 5)
     ) THEN
    RETURN 'confirmed';
  END IF;

  IF EXISTS (SELECT 1 FROM public.admin_notifications
             WHERE (kind = 'paid_booking_failed' AND ref_key = 'paid_booking_failed:' || p_stripe_session_id)
                OR (kind = 'stripe_stage_payment_failed' AND ref_key = p_stripe_session_id)) THEN
    RETURN 'failed';
  END IF;
  RETURN 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.get_payment_booking_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_booking_status(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.get_payment_booking_status(text) IS 'Read-only opaque checkout status for Stripe return; exposes no customer data and confirms only actual bookings.';