-- DRAFT ONLY; not registered, installed, or executed. Depends on payment-ledger.sql.
-- This reports verified gross receipts, NOT net receipts after refunds.
CREATE FUNCTION public.admin_verified_payment_report(p_start timestamptz, p_end timestamptz, p_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_start IS NULL OR p_end IS NULL OR p_start >= p_end THEN RAISE EXCEPTION 'invalid_period'; END IF;
  WITH payments AS (
    SELECT * FROM public.stripe_payments p WHERE p.paid_at >= p_start AND p.paid_at < p_end
      AND (p_email IS NULL OR lower(p.customer_email)=lower(trim(p_email)))
  ), refs AS (
    SELECT stripe_session_id FROM public.reservations WHERE stripe_session_id IS NOT NULL
      AND created_at >= p_start AND created_at < p_end AND (p_email IS NULL OR lower(email)=lower(trim(p_email)))
    UNION
    SELECT stripe_session_id FROM public.client_packages WHERE stripe_session_id IS NOT NULL
      AND created_at >= p_start AND created_at < p_end AND (p_email IS NULL OR lower(email)=lower(trim(p_email)))
  )
  SELECT jsonb_build_object(
    'basis','stripe_payment_evidence','currency','eur','historical_coverage','not_certified',
    'verified_gross_received_cents',coalesce(sum(amount_cents),0),
    'verified_session_count',count(*),
    'expected_cents', CASE WHEN count(*)>0 AND count(expected_amount_cents)=count(*) THEN sum(expected_amount_cents) END,
    'gap_cents', CASE WHEN count(*)>0 AND count(expected_amount_cents)=count(*) THEN sum(expected_amount_cents-amount_cents) END,
    'contract_total_cents',NULL,'balance_cents',NULL,'net_received_cents',NULL,
    'refund_coverage','not_certified',
    'unmatched_reference_count',(SELECT count(*) FROM refs r WHERE NOT EXISTS (SELECT 1 FROM public.stripe_payments p WHERE p.stripe_session_id=r.stripe_session_id))
  ) INTO result FROM payments;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_verified_payment_report(timestamptz,timestamptz,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verified_payment_report(timestamptz,timestamptz,text) TO authenticated;