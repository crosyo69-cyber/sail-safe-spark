-- =====================================================================
-- ROLLBACK COMPLET — LOT C-2.2-D (flux OTP / session sécurisée)
-- Fichier de secours. NE PAS APPLIQUER sauf incident majeur.
-- NON EXÉCUTÉ à ce jour.
--
-- ATTENTION SÉCURITÉ : appliquer ce script RÉTABLIT l'accès aux données
-- client avec le SEUL package_code (aucun second facteur). Il réintroduit
-- volontairement le risque que C-2.2-D avait supprimé. À n'utiliser que
-- comme mesure de continuité de service temporaire.
--
-- PÉRIMÈTRE
--   Couvert     : objets créés/supprimés par C-2.2-D (RPC *_by_session /
--                 *_with_session, RPC *_with_code / *_by_code supprimées,
--                 GRANTs associés) + la façade stage C-2 F1.
--   Non couvert : C-1, C-2 Phase 1 (code_access_*), C-2.2-A, C-2.2-B,
--                 C-2.2-C (otp_challenges / otp_sessions / otp_*),
--                 C-2.2-D-FIX (move_to_dlq → voir C2_2D_rollback.sql),
--                 C-3 / C-3b. AUCUN de ces objets n'est touché ici.
--
-- DÉVIATION DOCUMENTÉE
--   Les helpers internes client_package_payload / client_credits_payload /
--   client_history_payload / client_wallet_payload ont été introduits par
--   C-2.2-D. Ils sont CONSERVÉS : les fonctions par code restaurées
--   ci-dessous les réutilisent, ce qui garantit une logique métier
--   strictement identique et évite toute divergence. Ils restent
--   non exposés (aucun EXECUTE anon/authenticated).
--
-- ORDRE STRICT
--   1. restauration des fonctions par code (définitions + signatures)
--   2. restauration de leurs GRANTs
--   3. suppression des fonctions introduites par D (et par C-2 F1)
--   4. aucun objet C-2.2-C supprimé (tous préexistaient à D ou sont
--      partagés avec le socle OTP)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. RESTAURATION DES RPC PAR CODE (état pré-C-2.2-D)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  PERFORM public.code_access_guard(p_code, 'get_package_by_code');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'get_package_by_code', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN RETURN NULL; END IF;
  RETURN public.client_package_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credits_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  PERFORM public.code_access_guard(p_code, 'get_credits_by_code');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'get_credits_by_code', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN public.client_credits_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_package_credits_history(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  PERFORM public.code_access_guard(p_code, 'get_package_credits_history');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'get_package_credits_history', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN public.client_history_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_wallet_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  PERFORM public.code_access_guard(p_code, 'get_wallet_by_code');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'get_wallet_by_code', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('wallet','[]'::jsonb,'history','[]'::jsonb,'credits','[]'::jsonb);
  END IF;
  RETURN public.client_wallet_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credit_reminders(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid; v_res jsonb;
BEGIN
  PERFORM public.code_access_guard(p_code, 'get_credit_reminders');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'get_credit_reminders', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true);
  END IF;
  SELECT jsonb_build_object(
    'remind_30', COALESCE(p.remind_30, true),
    'remind_7',  COALESCE(p.remind_7, true),
    'remind_0',  COALESCE(p.remind_0, true))
    INTO v_res
    FROM public.client_packages cp
    LEFT JOIN public.credit_reminder_preferences p ON p.package_id = cp.id
   WHERE cp.id = v_pkg LIMIT 1;
  RETURN COALESCE(v_res, jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_credit_reminders(
  p_code text, p_remind_30 boolean, p_remind_7 boolean, p_remind_0 boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  PERFORM public.code_access_guard(p_code, 'set_credit_reminders');
  SELECT id INTO v_pkg FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'set_credit_reminders', v_pkg IS NOT NULL);
  IF v_pkg IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  INSERT INTO public.credit_reminder_preferences (package_id, remind_30, remind_7, remind_0)
  VALUES (v_pkg, COALESCE(p_remind_30, true), COALESCE(p_remind_7, true), COALESCE(p_remind_0, true))
  ON CONFLICT (package_id) DO UPDATE
    SET remind_30 = EXCLUDED.remind_30, remind_7 = EXCLUDED.remind_7,
        remind_0 = EXCLUDED.remind_0, updated_at = now();

  RETURN jsonb_build_object('ok', true,
    'remind_30', COALESCE(p_remind_30, true),
    'remind_7',  COALESCE(p_remind_7, true),
    'remind_0',  COALESCE(p_remind_0, true));
END;
$$;

CREATE OR REPLACE FUNCTION public.book_daily_with_code(p_code text, p_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_pkg public.client_packages;
  v_group_id uuid; v_booking_id uuid; v_valid int;
BEGIN
  PERFORM public.code_access_guard(p_code, 'book_daily_with_code');
  SELECT * INTO v_pkg FROM public.client_packages
    WHERE upper(package_code) = upper(btrim(p_code)) FOR UPDATE;
  PERFORM public.code_access_record(p_code, 'book_daily_with_code', FOUND);
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;

  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok',false,'error','no_credits_left');
  END IF;
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'error','date_in_past'); END IF;

  SELECT COUNT(*) INTO v_valid FROM public.session_credits
   WHERE package_id = v_pkg.id AND status = 'available' AND expires_at >= now();
  IF v_valid = 0 THEN RETURN jsonb_build_object('ok',false,'error','credits_expired'); END IF;

  IF EXISTS (
    SELECT 1 FROM public.package_bookings pb
    JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
    WHERE pb.package_id = v_pkg.id AND dg.date = p_date AND pb.status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('ok',false,'error','already_booked_this_date');
  END IF;

  v_group_id := public.find_or_create_daily_group(p_date, v_pkg.activity, 1);

  INSERT INTO public.package_bookings(package_id, daily_group_id, status, booking_kind)
    VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular')
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok',true,'booking_id',v_booking_id,'daily_group_id',v_group_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg_id uuid; v_date date;
BEGIN
  PERFORM public.code_access_guard(p_code, 'cancel_booking_with_code');
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE upper(package_code) = upper(btrim(p_code));
  PERFORM public.code_access_record(p_code, 'cancel_booking_with_code', v_pkg_id IS NOT NULL);
  IF v_pkg_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  SELECT dg.date INTO v_date
    FROM public.package_bookings b
    LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
   WHERE b.id = p_booking_id AND b.package_id = v_pkg_id;
  IF NOT FOUND OR v_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_date <= (CURRENT_DATE + interval '2 days')::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late_to_cancel');
  END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id AND status = 'confirmed';

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Réservation Stage par code (état pré-C-2 F1)
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

-- ---------------------------------------------------------------------
-- 2. GRANTS D'ORIGINE
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_package_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_credits_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_package_credits_history(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_wallet_by_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_credit_reminders(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_credit_reminders(text, boolean, boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_daily_with_code(text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_booking_with_code(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_stage_100_glisse(text, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_package_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credits_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_package_credits_history(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_reminders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_credit_reminders(text, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_daily_with_code(text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_code(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_stage_100_glisse(text, date) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. SUPPRESSION DES OBJETS INTRODUITS PAR C-2.2-D (et C-2 F1)
--    Les fonctions du socle OTP (C-2.2-C) ne sont PAS supprimées ici :
--    elles préexistaient à D. request_otp / verify_otp / revoke_otp_session
--    et validate_otp_session sont créées par D : on les retire.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.book_stage_with_session(text, date);
DROP FUNCTION IF EXISTS public.cancel_booking_with_session(text, uuid);
DROP FUNCTION IF EXISTS public.book_daily_with_session(text, date);
DROP FUNCTION IF EXISTS public.set_credit_reminders_by_session(text, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS public.get_credit_reminders_by_session(text);
DROP FUNCTION IF EXISTS public.get_wallet_by_session(text);
DROP FUNCTION IF EXISTS public.get_package_credits_history_by_session(text);
DROP FUNCTION IF EXISTS public.get_credits_by_session(text);
DROP FUNCTION IF EXISTS public.get_package_by_session(text);
DROP FUNCTION IF EXISTS public.get_marketing_preferences_by_session(text);
DROP FUNCTION IF EXISTS public.save_marketing_preferences_by_session(text, boolean, text[], text[]);

DROP FUNCTION IF EXISTS public.revoke_otp_session(text);
DROP FUNCTION IF EXISTS public.request_otp(text);
DROP FUNCTION IF EXISTS public.verify_otp(text, text);
DROP FUNCTION IF EXISTS public.validate_otp_session(text);

-- NOTE : les helpers client_*_payload sont volontairement CONSERVÉS
-- (voir « DÉVIATION DOCUMENTÉE » en tête de fichier) car les fonctions
-- par code restaurées ci-dessus s'appuient dessus.

-- ---------------------------------------------------------------------
-- 4. CONTRÔLE — doit renvoyer les 9 fonctions par code restaurées
-- ---------------------------------------------------------------------
-- SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname = 'public' AND p.proname IN (
--    'get_package_by_code','get_credits_by_code','get_package_credits_history',
--    'get_wallet_by_code','get_credit_reminders','set_credit_reminders',
--    'book_daily_with_code','cancel_booking_with_code','book_stage_100_glisse');

COMMIT;
