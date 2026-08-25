-- =====================================================================
-- LOT C-2 — PHASE CORRECTIVE FINALE (F1 + F2 + F4)
-- F1 : suppression du bypass "réservation Stage avec le seul package_code"
-- F2 : suppression du bypass "PII marketing avec le seul package_code"
-- F4 : durcissement des GRANTs DLQ
-- Aucune donnée métier modifiée. Aucun cron modifié. Aucune RLS modifiée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- F1.1 — Logique métier stage factorisée (source de vérité UNIQUE),
--        non exposée : le package_id est toujours fourni par le serveur.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_stage_for_package(
  p_package_id uuid,
  p_start_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_stage_group UUID := gen_random_uuid();
  v_day DATE;
  v_group_id UUID;
  v_booking_id UUID;
  v_booking_ids UUID[] := ARRAY[]::UUID[];
  v_i INT;
  v_taken INT;
  v_cap INT;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
    WHERE id = p_package_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.activity <> 'stage_100_glisse' THEN
    RETURN jsonb_build_object('ok',false,'error','not_a_stage_package');
  END IF;
  IF (v_pkg.total_sessions - v_pkg.used_sessions) < 5 THEN
    RETURN jsonb_build_object('ok',false,'error','not_enough_credits');
  END IF;
  IF p_start_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok',false,'error','start_in_past');
  END IF;

  -- Vérifie d'abord la disponibilité sur les 5 jours (au moins 1 place par jour dans un groupe stage)
  FOR v_i IN 0..4 LOOP
    v_day := p_start_date + v_i;

    SELECT dg.id INTO v_group_id
      FROM public.daily_groups dg
      WHERE dg.date = v_day
        AND dg.activity = 'stage_100_glisse'
        AND dg.status = 'open'
      ORDER BY dg.group_index ASC
      LIMIT 1
      FOR UPDATE;

    IF v_group_id IS NULL THEN
      NULL;
    ELSE
      SELECT dg.max_participants INTO v_cap FROM public.daily_groups dg WHERE dg.id = v_group_id;
      SELECT
        COALESCE((SELECT SUM(participants) FROM public.reservations
                   WHERE daily_group_id = v_group_id AND status <> 'cancelled'),0)
      + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                   WHERE daily_group_id = v_group_id AND status = 'confirmed'),0)
      INTO v_taken;
      IF v_taken >= v_cap THEN
        RAISE EXCEPTION 'day_full:%', v_day;
      END IF;
    END IF;
  END LOOP;

  -- Crée les réservations effectives sur les 5 jours
  FOR v_i IN 0..4 LOOP
    v_day := p_start_date + v_i;

    v_group_id := public.find_or_create_daily_group(v_day, 'stage_100_glisse', 1);

    UPDATE public.daily_groups
       SET notes = COALESCE(notes, '') ||
                   CASE WHEN COALESCE(notes,'') = '' THEN '' ELSE E'\n' END ||
                   'Stage 100% Glisse - ID:' || v_stage_group::text
     WHERE id = v_group_id
       AND (notes IS NULL OR notes NOT LIKE '%Stage 100%% Glisse - ID:' || v_stage_group::text || '%');

    INSERT INTO public.package_bookings(package_id, daily_group_id, status, booking_kind)
      VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular')
    RETURNING id INTO v_booking_id;

    v_booking_ids := array_append(v_booking_ids, v_booking_id);
  END LOOP;

  IF array_length(v_booking_ids,1) > 0 THEN
    PERFORM public.enqueue_booking_confirmation(v_booking_ids[1]);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'stage_group_id', v_stage_group,
    'booking_ids', v_booking_ids,
    'start_date', p_start_date
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.book_stage_for_package(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_stage_for_package(uuid, date) FROM anon;
REVOKE ALL ON FUNCTION public.book_stage_for_package(uuid, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.book_stage_for_package(uuid, date) TO service_role;

-- ---------------------------------------------------------------------
-- F1.1 — Façade publique : session OTP obligatoire.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_stage_with_session(
  p_session_token text,
  p_start_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_package_id uuid;
BEGIN
  v_package_id := public.validate_otp_session(p_session_token);
  IF v_package_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_invalid');
  END IF;

  RETURN public.book_stage_for_package(v_package_id, p_start_date);
END;
$function$;

REVOKE ALL ON FUNCTION public.book_stage_with_session(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_stage_with_session(text, date) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- F1.2 — Suppression du bypass historique.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.book_stage_100_glisse(text, date);

-- ---------------------------------------------------------------------
-- F2 — Marketing : le package_code cesse d'être une autorisation.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_marketing_preferences(text, uuid);
DROP FUNCTION IF EXISTS public.save_marketing_preferences(boolean, text[], text[], text, uuid);
DROP FUNCTION IF EXISTS public.resolve_marketing_email(text, uuid);

-- Résolution par token marketing uniquement (parcours historique des e-mails).
CREATE OR REPLACE FUNCTION public.resolve_marketing_email(p_token uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT lower(mp.email)
    FROM public.marketing_preferences mp
   WHERE p_token IS NOT NULL AND mp.token = p_token
   LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.resolve_marketing_email(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_marketing_email(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_marketing_email(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_marketing_email(uuid) TO service_role;

-- Lecture interne mutualisée (email déjà autorisé par l'appelant).
CREATE OR REPLACE FUNCTION public.marketing_preferences_payload(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text := lower(btrim(p_email)); v jsonb;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT jsonb_build_object(
    'found', true,
    'email', v_email,
    'consent', coalesce(mp.consent, false),
    'activities', to_jsonb(coalesce(mp.activities, '{}')),
    'topics', to_jsonb(coalesce(mp.topics, '{}')),
    'first_name', pr.first_name,
    'updated_at', mp.updated_at
  ) INTO v
  FROM (SELECT 1) x
  LEFT JOIN public.marketing_preferences mp ON lower(mp.email) = v_email
  LEFT JOIN public.crm_client_profiles pr ON lower(pr.email) = v_email;

  RETURN coalesce(v, jsonb_build_object('found', true, 'email', v_email, 'consent', false,
                                        'activities', '[]'::jsonb, 'topics', '[]'::jsonb));
END;
$function$;

REVOKE ALL ON FUNCTION public.marketing_preferences_payload(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marketing_preferences_payload(text) FROM anon;
REVOKE ALL ON FUNCTION public.marketing_preferences_payload(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_preferences_payload(text) TO service_role;

CREATE OR REPLACE FUNCTION public.marketing_preferences_save(
  p_email text,
  p_consent boolean,
  p_activities text[],
  p_topics text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text := lower(btrim(p_email));
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  INSERT INTO public.marketing_preferences (email, consent, consent_at, consent_source, activities, topics)
  VALUES (v_email, coalesce(p_consent, false),
          CASE WHEN p_consent THEN now() ELSE NULL END,
          'PREFERENCE_CENTER',
          coalesce(p_activities, '{}'), coalesce(p_topics, '{}'))
  ON CONFLICT (email) DO UPDATE
    SET consent = EXCLUDED.consent,
        consent_at = CASE WHEN EXCLUDED.consent THEN coalesce(public.marketing_preferences.consent_at, now()) ELSE NULL END,
        consent_source = 'PREFERENCE_CENTER',
        activities = EXCLUDED.activities,
        topics = EXCLUDED.topics,
        updated_at = now();

  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$function$;

REVOKE ALL ON FUNCTION public.marketing_preferences_save(text, boolean, text[], text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.marketing_preferences_save(text, boolean, text[], text[]) FROM anon;
REVOKE ALL ON FUNCTION public.marketing_preferences_save(text, boolean, text[], text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_preferences_save(text, boolean, text[], text[]) TO service_role;

-- Parcours historique : token marketing (seule autorisation de ce parcours).
CREATE OR REPLACE FUNCTION public.get_marketing_preferences(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text;
BEGIN
  v_email := public.resolve_marketing_email(p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN public.marketing_preferences_payload(v_email);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_marketing_preferences(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketing_preferences(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.save_marketing_preferences(
  p_consent boolean,
  p_activities text[],
  p_topics text[],
  p_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text;
BEGIN
  v_email := public.resolve_marketing_email(p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  RETURN public.marketing_preferences_save(v_email, p_consent, p_activities, p_topics);
END;
$function$;

REVOKE ALL ON FUNCTION public.save_marketing_preferences(boolean, text[], text[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_marketing_preferences(boolean, text[], text[], uuid) TO anon, authenticated, service_role;

-- Parcours cible : session OTP (le client ne choisit jamais le package_id).
CREATE OR REPLACE FUNCTION public.get_marketing_preferences_by_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_package_id uuid; v_email text;
BEGIN
  v_package_id := public.validate_otp_session(p_session_token);
  IF v_package_id IS NULL THEN RETURN jsonb_build_object('found', false, 'error', 'session_invalid'); END IF;

  SELECT lower(cp.email) INTO v_email FROM public.client_packages cp WHERE cp.id = v_package_id;
  IF v_email IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  RETURN public.marketing_preferences_payload(v_email);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_marketing_preferences_by_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_marketing_preferences_by_session(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.save_marketing_preferences_by_session(
  p_session_token text,
  p_consent boolean,
  p_activities text[],
  p_topics text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_package_id uuid; v_email text;
BEGIN
  v_package_id := public.validate_otp_session(p_session_token);
  IF v_package_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'session_invalid'); END IF;

  SELECT lower(cp.email) INTO v_email FROM public.client_packages cp WHERE cp.id = v_package_id;
  IF v_email IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;

  RETURN public.marketing_preferences_save(v_email, p_consent, p_activities, p_topics);
END;
$function$;

REVOKE ALL ON FUNCTION public.save_marketing_preferences_by_session(text, boolean, text[], text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_marketing_preferences_by_session(text, boolean, text[], text[]) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- F4 — Durcissement DLQ (GRANTs uniquement, logique inchangée).
-- run_dlq_retry_cycle est le wrapper SECURITY DEFINER de retry_dlq_messages :
-- le laisser exécutable par anon annulerait le durcissement.
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.retry_dlq_messages(text, text, integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.retry_dlq_messages(text, text, integer, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.retry_dlq_messages(text, text, integer, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.retry_dlq_messages(text, text, integer, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.run_dlq_retry_cycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_dlq_retry_cycle() FROM anon;
REVOKE ALL ON FUNCTION public.run_dlq_retry_cycle() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.run_dlq_retry_cycle() TO service_role;