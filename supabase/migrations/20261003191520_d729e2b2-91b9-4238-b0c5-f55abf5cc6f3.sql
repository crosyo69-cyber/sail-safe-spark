-- S1 : support structurel multi-participants (Stage 100% Glisse).
-- Ajoute client_packages.participant_index (NULL pour l'historique, 1..4 pour
-- les futurs packs multi-participants). Aucune donnée modifiée.
-- L'unicité « 1 paiement = 1 pack » est conservée pour les lignes sans index
-- (idempotence P0-2 du webhook actuel), et devient « 1 paiement + 1 index = 1 pack ».
ALTER TABLE public.client_packages
  ADD COLUMN participant_index integer NULL;

ALTER TABLE public.client_packages
  ADD CONSTRAINT client_packages_participant_index_range_chk
  CHECK (participant_index IS NULL OR participant_index BETWEEN 1 AND 4);

DROP INDEX IF EXISTS public.uq_client_packages_stripe_session_id;

CREATE UNIQUE INDEX uq_client_packages_stripe_session_no_index
  ON public.client_packages (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL AND participant_index IS NULL;

CREATE UNIQUE INDEX uq_client_packages_stripe_session_participant
  ON public.client_packages (stripe_session_id, participant_index)
  WHERE stripe_session_id IS NOT NULL AND participant_index IS NOT NULL;

COMMENT ON COLUMN public.client_packages.participant_index IS
  'S1 : rang du participant (1..4) pour un paiement Stripe multi-participants. NULL = pack historique ou mono-pack.';