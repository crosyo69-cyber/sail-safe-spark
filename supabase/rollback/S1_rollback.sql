-- Rollback S1 (participant_index). Échoue volontairement si des packs
-- multi-participants existent déjà (l'ancien index unique serait violé).
BEGIN;
DROP INDEX IF EXISTS public.uq_client_packages_stripe_session_participant;
DROP INDEX IF EXISTS public.uq_client_packages_stripe_session_no_index;
ALTER TABLE public.client_packages DROP CONSTRAINT IF EXISTS client_packages_participant_index_range_chk;
ALTER TABLE public.client_packages DROP COLUMN IF EXISTS participant_index;
CREATE UNIQUE INDEX uq_client_packages_stripe_session_id
  ON public.client_packages (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
COMMIT;
