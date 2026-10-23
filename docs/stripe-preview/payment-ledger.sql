-- DRAFT ONLY. Not applied or registered as a migration. Separate approval required.
-- No historical backfill. No booking/capacity/weather changes.
CREATE TABLE public.stripe_payments (
  stripe_session_id text PRIMARY KEY,
  stripe_payment_intent_id text,
  event_id text NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  expected_amount_cents bigint CHECK (expected_amount_cents > 0),
  currency text NOT NULL CHECK (currency = 'eur'),
  payment_status text NOT NULL CHECK (payment_status = 'paid'),
  operation text NOT NULL CHECK (operation IN ('dated_reservation','pack_purchase','stage','legacy_unknown')),
  activity_name text,
  participants integer NOT NULL CHECK (participants > 0),
  customer_email text,
  paid_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stripe_payments TO authenticated;
GRANT SELECT, INSERT ON public.stripe_payments TO service_role;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin payment reads" ON public.stripe_payments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.admin_payment_ledger(p_email text DEFAULT NULL)
RETURNS SETOF public.stripe_payments LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  RETURN QUERY SELECT p.* FROM public.stripe_payments p
    WHERE p_email IS NULL OR lower(p.customer_email) = lower(trim(p_email)) ORDER BY p.paid_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_payment_ledger(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_payment_ledger(text) TO authenticated;
CREATE FUNCTION public.get_pack_payment_status(p_stripe_session_id text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_stripe_session_id IS NULL OR p_stripe_session_id !~ '^cs_(live|test)_[A-Za-z0-9]{20,255}$' THEN RETURN 'pending'; END IF;
  IF EXISTS (SELECT 1 FROM public.stripe_payments sp JOIN public.client_packages cp USING(stripe_session_id)
      WHERE sp.stripe_session_id = p_stripe_session_id AND sp.operation='pack_purchase'
        AND cp.status='active' AND cp.deposit_paid_at IS NOT NULL) THEN RETURN 'confirmed'; END IF;
  IF EXISTS (SELECT 1 FROM public.admin_notifications WHERE kind='paid_booking_failed'
    AND ref_key='paid_booking_failed:' || p_stripe_session_id) THEN RETURN 'failed'; END IF;
  RETURN 'pending';
END;
$$;
REVOKE ALL ON FUNCTION public.get_pack_payment_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pack_payment_status(text) TO anon, authenticated, service_role;
