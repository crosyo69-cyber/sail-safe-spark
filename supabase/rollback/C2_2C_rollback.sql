-- ROLLBACK LOT C-2.2-C — supprime UNIQUEMENT le socle OTP créé par C-2.2-C.
-- NE PAS APPLIQUER sauf incident. Autonome. Aucun objet préexistant touché.
-- Ordre : fonctions (dépendances) puis tables (otp_sessions référence otp_challenges).

DROP FUNCTION IF EXISTS public.otp_verify_challenge(uuid, text);
DROP FUNCTION IF EXISTS public.otp_create_session(uuid, uuid);
DROP FUNCTION IF EXISTS public.otp_create_challenge(uuid, text);
DROP FUNCTION IF EXISTS public.otp_generate_code();

DROP INDEX IF EXISTS public.ux_otp_sessions_challenge_once;
DROP INDEX IF EXISTS public.idx_otp_sessions_package;
DROP TABLE IF EXISTS public.otp_sessions;

DROP INDEX IF EXISTS public.idx_otp_challenges_active;
DROP INDEX IF EXISTS public.idx_otp_challenges_expires;
DROP TABLE IF EXISTS public.otp_challenges;
