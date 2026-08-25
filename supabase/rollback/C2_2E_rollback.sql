-- =====================================================================
-- ROLLBACK — LOT C-2 PHASE CORRECTIVE FINALE (F1 + F2 + F4)
-- Fichier de secours. NE PAS APPLIQUER sauf incident majeur.
-- NON EXÉCUTÉ à ce jour.
--
-- ATTENTION SÉCURITÉ : appliquer ce script RÉINTRODUIT volontairement
-- les deux bypass corrigés par la phase finale :
--   - réservation de stage avec le SEUL package_code (sans OTP)
--   - lecture/écriture des préférences marketing (PII e-mail) avec le
--     SEUL package_code (sans OTP, sans rate-limit)
-- À n'utiliser que comme mesure temporaire de continuité de service.
--
-- PÉRIMÈTRE
--   Couvert     : F1 (façade stage), F2 (préférences marketing),
--                 F4 (durcissement des GRANTs DLQ).
--   Non couvert : C-1, C-2 Phase 1, C-2.2-A/B/C, C-2.2-D et C-2.2-D-FIX
--                 (voir C2_2D_rollback.sql et C2_2D_rollback_full.sql),
--                 C-3 / C-3b. Aucun de ces objets n'est touché ici.
--
-- Ce rollback est INDÉPENDANT de C2_2D_rollback_full.sql. Si les deux
-- doivent être appliqués, appliquer d'abord CE fichier (retour à l'état
-- pré-phase-finale), puis C2_2D_rollback_full.sql.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- F1 — RESTAURATION DE LA RÉSERVATION DE STAGE PAR CODE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_stage_100_glisse(p_code text, p_start_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg_id uuid;
BEGIN
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF v_pkg_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  RETURN public.book_stage_for_package(v_pkg_id, p_start_date);
END;
$$;

REVOKE ALL ON FUNCTION public.book_stage_100_glisse(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_stage_100_glisse(text, date) TO anon, authenticated;

-- Suppression de la façade session introduite par F1
DROP FUNCTION IF EXISTS public.book_stage_with_session(text, date);

-- ---------------------------------------------------------------------
-- F2 — RESTAURATION DES PRÉFÉRENCES MARKETING PAR CODE
--   Signatures d'origine : (p_code text, p_token uuid) et
--   (p_consent, p_activities, p_topics, p_code, p_token).
--   On supprime d'abord les signatures actuelles (p_token seul).
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_marketing_preferences(uuid);
DROP FUNCTION IF EXISTS public.save_marketing_preferences(boolean, text[], text[], uuid);

CREATE OR REPLACE FUNCTION public.get_marketing_preferences(p_code text, p_token uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_email text;
BEGIN
  IF p_token IS NOT NULL THEN
    v_email := public.resolve_marketing_email(p_token);
  ELSIF p_code IS NOT NULL THEN
    SELECT lower(cp.email) INTO v_email
      FROM public.client_packages cp
     WHERE upper(cp.package_code) = upper(btrim(p_code));
  END IF;

  IF v_email IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN public.marketing_preferences_payload(v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.save_marketing_preferences(
  p_consent boolean, p_activities text[], p_topics text[], p_code text, p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_email text;
BEGIN
  IF p_token IS NOT NULL THEN
    v_email := public.resolve_marketing_email(p_token);
  ELSIF p_code IS NOT NULL THEN
    SELECT lower(cp.email) INTO v_email
      FROM public.client_packages cp
     WHERE upper(cp.package_code) = upper(btrim(p_code));
  END IF;

  IF v_email IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  RETURN public.marketing_preferences_save(v_email, p_consent, p_activities, p_topics);
END;
$$;

REVOKE ALL ON FUNCTION public.get_marketing_preferences(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_marketing_preferences(boolean, text[], text[], text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketing_preferences(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_marketing_preferences(boolean, text[], text[], text, uuid) TO anon, authenticated;

-- Suppression des variantes session introduites par F2
DROP FUNCTION IF EXISTS public.get_marketing_preferences_by_session(text);
DROP FUNCTION IF EXISTS public.save_marketing_preferences_by_session(text, boolean, text[], text[]);

-- ---------------------------------------------------------------------
-- F4 — RESTAURATION DES GRANTS DLQ (état permissif d'origine)
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.retry_dlq_messages(text, text, integer, integer, integer)
  TO PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_dlq_retry_cycle() TO PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- CONTRÔLE — doit renvoyer book_stage_100_glisse,
-- get_marketing_preferences(text,uuid), save_marketing_preferences(...text,uuid)
-- ---------------------------------------------------------------------
-- SELECT p.proname, pg_get_function_identity_arguments(p.oid)
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public'
--    AND p.proname IN ('book_stage_100_glisse','get_marketing_preferences',
--                      'save_marketing_preferences');

COMMIT;
