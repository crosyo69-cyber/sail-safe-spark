-- S2 : réservation atomique d'un Stage 100% Glisse pour 1 à 4 participants.
-- Orchestration seulement : 1 client_package par participant, puis 1 appel
-- à book_stage_for_package (gelé, inchangé) par participant.
-- Indivisibilité : les N participants occupent le même daily_group chaque jour.
CREATE OR REPLACE FUNCTION public.book_stage_for_participants(
  p_stripe_session_id text,
  p_start_date date,
  p_participants jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_n int;
  v_i int;
  v_d int;
  v_day date;
  v_p jsonb;
  v_pkg_ids uuid[] := ARRAY[]::uuid[];
  v_codes text[] := ARRAY[]::text[];
  v_pkg_id uuid;
  v_code text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_try int;
  v_res jsonb;
  v_stage_ids uuid[] := ARRAY[]::uuid[];
  v_group record;
  v_taken int;
  v_distinct int;
  v_constraint text;
BEGIN
  -- Validation des entrées
  IF p_stripe_session_id IS NULL OR length(trim(p_stripe_session_id)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'stripe_session_required');
  END IF;
  IF p_start_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'start_date_required');
  END IF;
  IF p_participants IS NULL OR jsonb_typeof(p_participants) <> 'array' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants');
  END IF;
  v_n := jsonb_array_length(p_participants);
  IF v_n < 1 OR v_n > 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants_count');
  END IF;
  FOR v_i IN 0..v_n - 1 LOOP
    v_p := p_participants -> v_i;
    IF coalesce(trim(v_p->>'email'), '') = ''
       OR coalesce(trim(v_p->>'first_name'), '') = ''
       OR coalesce(trim(v_p->>'last_name'), '') = '' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'invalid_participant_data', 'participant_index', v_i + 1);
    END IF;
  END LOOP;

  -- Bloc transactionnel : toute erreur annule l'ensemble des écritures du bloc.
  BEGIN
    -- 1) Verrous par date, J -> J+4, même clé que find_or_create_daily_group
    --    (ré-entrant dans la même transaction).
    FOR v_d IN 0..4 LOOP
      PERFORM pg_advisory_xact_lock(
        hashtext('public.find_or_create_daily_group:' || (p_start_date + v_d)::text || ':stage_100_glisse')
      );
    END LOOP;

    -- 2) Pré-contrôle d'indivisibilité : le groupe que find_or_create_daily_group
    --    choisira pour le 1er participant doit avoir N places libres.
    FOR v_d IN 0..4 LOOP
      v_day := p_start_date + v_d;
      FOR v_group IN
        SELECT id, max_participants FROM public.daily_groups
         WHERE date = v_day AND activity = 'stage_100_glisse' AND status = 'open'
         ORDER BY group_index ASC
      LOOP
        SELECT
          COALESCE((SELECT SUM(participants) FROM public.reservations
                     WHERE daily_group_id = v_group.id AND status <> 'cancelled'),0)
        + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                     WHERE daily_group_id = v_group.id AND status = 'confirmed'),0)
        INTO v_taken;
        IF v_taken + 1 <= v_group.max_participants THEN
          IF v_taken + v_n > v_group.max_participants THEN
            RAISE EXCEPTION 'indivisible_group_unavailable:%', v_day;
          END IF;
          EXIT;
        END IF;
      END LOOP;
    END LOOP;

    -- 3) Création des packs, participant_index croissant.
    FOR v_i IN 1..v_n LOOP
      v_p := p_participants -> (v_i - 1);
      v_pkg_id := NULL;
      FOR v_try IN 1..10 LOOP
        v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
        v_code := 'KP-' || to_char(now(), 'YYYY') || '-'
          || substr(v_alphabet, (get_byte(v_bytes, 0) % 32) + 1, 1)
          || substr(v_alphabet, (get_byte(v_bytes, 1) % 32) + 1, 1)
          || substr(v_alphabet, (get_byte(v_bytes, 2) % 32) + 1, 1)
          || substr(v_alphabet, (get_byte(v_bytes, 3) % 32) + 1, 1);
        BEGIN
          INSERT INTO public.client_packages(
            package_code, email, first_name, last_name, phone,
            activity, package_type, total_sessions, deposit_amount, deposit_paid_at,
            stripe_session_id, participant_index, status)
          VALUES (
            v_code, lower(trim(v_p->>'email')), trim(v_p->>'first_name'), trim(v_p->>'last_name'),
            nullif(trim(v_p->>'phone'), ''),
            'stage_100_glisse', 'Stage 100% Glisse', 5, 250.00, now(),
            p_stripe_session_id, v_i, 'active')
          RETURNING id INTO v_pkg_id;
          EXIT;
        EXCEPTION WHEN unique_violation THEN
          GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
          IF v_constraint = 'client_packages_package_code_key' THEN
            CONTINUE; -- collision de code uniquement : nouveau tirage
          END IF;
          RAISE EXCEPTION 'participant_already_exists:%', v_i;
        END;
      END LOOP;
      IF v_pkg_id IS NULL THEN
        RAISE EXCEPTION 'package_code_generation_failed';
      END IF;
      v_pkg_ids := array_append(v_pkg_ids, v_pkg_id);
      v_codes := array_append(v_codes, v_code);
    END LOOP;

    -- 4) Réservation : 1 appel à la fonction gelée par participant, dans l'ordre.
    FOR v_i IN 1..v_n LOOP
      v_res := public.book_stage_for_package(v_pkg_ids[v_i], p_start_date);
      IF coalesce((v_res->>'ok')::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'stage_booking_failed:%:%', v_i, coalesce(v_res->>'error', 'unknown');
      END IF;
      v_stage_ids := array_append(v_stage_ids, (v_res->>'stage_group_id')::uuid);
    END LOOP;

    -- 5) Contrôle final d'indivisibilité (garantie en cas d'écriture concurrente
    --    hors verrou de date) : un seul groupe par jour pour les N participants.
    FOR v_d IN 0..4 LOOP
      v_day := p_start_date + v_d;
      SELECT count(DISTINCT pb.daily_group_id), count(*) INTO v_distinct, v_taken
        FROM public.package_bookings pb
        JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
       WHERE pb.package_id = ANY(v_pkg_ids) AND pb.status = 'confirmed' AND dg.date = v_day;
      IF v_distinct <> 1 OR v_taken <> v_n THEN
        RAISE EXCEPTION 'indivisible_group_unavailable:%', v_day;
      END IF;
    END LOOP;

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', split_part(SQLERRM, ':', 1), 'detail', SQLERRM);
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'participants', v_n,
    'package_ids', to_jsonb(v_pkg_ids),
    'package_codes', to_jsonb(v_codes),
    'stage_group_ids', to_jsonb(v_stage_ids),
    'start_date', p_start_date
  );
END;
$$;

REVOKE ALL ON FUNCTION public.book_stage_for_participants(text, date, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_stage_for_participants(text, date, jsonb) TO service_role;

COMMENT ON FUNCTION public.book_stage_for_participants(text, date, jsonb) IS
  'S2 : crée N (1..4) packs Stage 100% Glisse (250 € chacun, participant_index 1..N) et appelle book_stage_for_package pour chacun, en tout ou rien. Les N participants partagent le même daily_group chaque jour. Réservé au service.';