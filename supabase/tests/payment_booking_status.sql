-- Read-only regression checks; no bookings, emails or payments are created.
SELECT 'unknown_session_stays_pending' AS rule,
  public.get_payment_booking_status('cs_test_QAUnknownSession000000000000') = 'pending' AS passed
UNION ALL
SELECT 'invalid_reference_stays_pending',
  public.get_payment_booking_status('invalid') = 'pending'
UNION ALL
SELECT 'actual_confirmed_reservations_are_confirmed',
  EXISTS (SELECT 1 FROM public.reservations WHERE status = 'confirmed' AND stripe_session_id IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM public.reservations r
    WHERE r.status = 'confirmed' AND r.stripe_session_id IS NOT NULL
      AND public.get_payment_booking_status(r.stripe_session_id) <> 'confirmed')
UNION ALL
SELECT 'anonymous_can_read_only_status',
  has_function_privilege('anon', 'public.get_payment_booking_status(text)', 'EXECUTE');