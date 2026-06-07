
-- Cancel the duplicate reservation for carine verdier (same stripe_session_id, same session, inserted 3 hours apart by webhook retry)
DELETE FROM public.reservations
WHERE id = '3c4481e9-1655-4179-a8fa-4403bc2f768f';

-- Add a unique partial index on stripe_session_id to make webhook + sync idempotent
CREATE UNIQUE INDEX IF NOT EXISTS reservations_stripe_session_unique
  ON public.reservations (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
