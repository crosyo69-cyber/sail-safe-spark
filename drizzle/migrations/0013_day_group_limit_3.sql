-- Plafond : 3 groupes opérationnels (open/closed) par date, toutes activités confondues.
-- Verrou commun par date, toujours acquis AVANT les verrous par activité / Stage.

CREATE OR REPLACE FUNCTION public.lock_day_groups(p_date date)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT pg_advisory_xact_lock(hashtext('public.day_group_limit:' || p_date::text)); $$;

CREATE OR REPLACE FUNCTION public.day_operational_group_count(p_date date, p_exclude uuid DEFAULT NULL)
RETURNS integer LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT count(*)::int FROM public.daily_groups
       WHERE date = p_date AND status IN ('open','closed')
         AND (p_exclude IS NULL OR id <> p_exclude); $$;

REVOKE ALL ON FUNCTION public.lock_day_groups(date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.day_operational_group_count(date, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lock_day_groups(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.day_operational_group_count(date, uuid) TO service_role;

-- Garde-fou en base : tout groupe qui devient opérationnel (création, réactivation,
-- changement de date) est compté sous le verrou de date. Le verrou transactionnel
-- est conservé jusqu'au COMMIT : deux transactions concurrentes sont sérialisées et
-- la seconde relit (READ COMMITTED, nouvel instantané par requête) le groupe validé.
CREATE OR REPLACE FUNCTION public.enforce_day_group_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('open','closed') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IN ('open','closed') AND OLD.date = NEW.date THEN
    RETURN NEW; -- déjà compté : n'affecte pas les groupes existants (ex. 22/10/2026)
  END IF;
  PERFORM public.lock_day_groups(NEW.date);
  IF public.day_operational_group_count(NEW.date, NEW.id) >= 3 THEN
    RAISE EXCEPTION 'day_group_limit_reached: %', NEW.date
      USING ERRCODE = 'P0001', HINT = 'Maximum 3 groupes par journée';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_day_group_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_day_group_limit ON public.daily_groups;
CREATE TRIGGER trg_enforce_day_group_limit
  BEFORE INSERT OR UPDATE OF status, date ON public.daily_groups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_day_group_limit();

-- Seul point de création de groupe.
CREATE OR REPLACE FUNCTION public.find_or_create_daily_group(p_date date, p_activity activity_type, p_seats integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_cap INT := public.default_max_participants(p_activity);
  v_taken INT;
  v_next_index INT;
BEGIN
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'date_in_past';
  END IF;

  -- Plafond journalier : verrou de date AVANT le verrou par activité (ré-entrant).
  PERFORM public.lock_day_groups(p_date);

  -- F-26-02 : verrou transactionnel déterministe par (date, activité).
  PERFORM pg_advisory_xact_lock(
    hashtext('public.find_or_create_daily_group:' || p_date::text || ':' || p_activity::text)
  );

  FOR v_group IN
    SELECT * FROM public.daily_groups
     WHERE date = p_date AND activity = p_activity AND status = 'open'
     ORDER BY group_index ASC
     FOR UPDATE
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_group.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_group.id AND status = 'confirmed'),0)
    INTO v_taken;

    IF (v_taken + p_seats) <= v_group.max_participants THEN
      RETURN v_group.id;
    END IF;
  END LOOP;

  -- Nouveau groupe nécessaire : refus explicite au-delà de 3 groupes opérationnels.
  IF public.day_operational_group_count(p_date) >= 3 THEN
    RAISE EXCEPTION 'day_group_limit_reached: %', p_date;
  END IF;

  SELECT COALESCE(MAX(group_index),0) + 1 INTO v_next_index
    FROM public.daily_groups WHERE date = p_date AND activity = p_activity;

  INSERT INTO public.daily_groups(date, activity, group_index, max_participants, status)
    VALUES (p_date, p_activity, v_next_index, v_cap, 'open')
  RETURNING id INTO v_group.id;

  RETURN v_group.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_or_create_compatible_group(p_date date, p_client_activity activity_type, p_seats integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_taken INT;
  v_seats INT := GREATEST(p_seats, 1);
BEGIN
  IF p_client_activity <> 'kitesurf' THEN
    RAISE EXCEPTION 'compatible_group_unsupported_activity: %', p_client_activity;
  END IF;
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'date_in_past';
  END IF;

  -- Ordre des verrous : 0) Date, 1) Stage, 2) Kitesurf.
  PERFORM public.lock_day_groups(p_date);
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':stage_100_glisse'));
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':kitesurf'));

  FOR v_group IN
    SELECT g.* FROM public.daily_groups g
     JOIN public.activity_group_compatibility c
       ON c.group_activity = g.activity AND c.allowed_client_activity = p_client_activity
     WHERE g.date = p_date AND g.status = 'open'
       AND (
         g.activity = 'kitesurf'
         OR (g.activity = 'stage_100_glisse' AND EXISTS (
               SELECT 1 FROM public.package_bookings pb
                WHERE pb.daily_group_id = g.id AND pb.status = 'confirmed'))
       )
     ORDER BY CASE WHEN g.activity = 'kitesurf' THEN 1 ELSE 2 END, g.group_index ASC
     FOR UPDATE OF g
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_group.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_group.id AND status = 'confirmed'),0)
    INTO v_taken;
    IF (v_taken + v_seats) <= v_group.max_participants THEN
      RETURN v_group.id;
    END IF;
  END LOOP;

  RETURN public.find_or_create_daily_group(p_date, 'kitesurf', v_seats);
END;
$function$;

-- Stage multi-participants : verrous de date (J..J+4, croissants) AVANT les verrous Stage.
CREATE OR REPLACE FUNCTION public.book_stage_for_participants(p_stripe_session_id text, p_start_date date, p_participants jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  BEGIN
    -- 0) Verrous de date (plafond journalier), J -> J+4.
    FOR v_d IN 0..4 LOOP
      PERFORM public.lock_day_groups(p_start_date + v_d);
    END LOOP;

    -- 1) Verrous Stage par date, J -> J+4.
    FOR v_d IN 0..4 LOOP
      PERFORM pg_advisory_xact_lock(
        hashtext('public.find_or_create_daily_group:' || (p_start_date + v_d)::text || ':stage_100_glisse')
      );
    END LOOP;

    -- 2) Pré-contrôle d'indivisibilité.
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

    -- 3) Création des packs.
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
            CONTINUE;
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

    -- 4) Réservation par participant.
    FOR v_i IN 1..v_n LOOP
      v_res := public.book_stage_for_package(v_pkg_ids[v_i], p_start_date);
      IF coalesce((v_res->>'ok')::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'stage_booking_failed:%:%', v_i, coalesce(v_res->>'error', 'unknown');
      END IF;
      v_stage_ids := array_append(v_stage_ids, (v_res->>'stage_group_id')::uuid);
    END LOOP;

    -- 5) Contrôle final d'indivisibilité.
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
$function$;

-- Disponibilité : aucune place "potentielle" annoncée si la journée a déjà 3 groupes
-- opérationnels (évite un paiement pour une journée qui ne peut plus créer de groupe).
CREATE OR REPLACE FUNCTION public.get_daily_availability(p_date date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH grp AS (
    SELECT dg.id, dg.activity, dg.max_participants,
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0) AS taken
    FROM public.daily_groups dg
    WHERE dg.date = p_date AND dg.status = 'open'
  ), lim AS (
    SELECT (SELECT count(*) FROM public.daily_groups
             WHERE date = p_date AND status IN ('open','closed')) >= 3 AS full_day
  )
  SELECT jsonb_build_object(
    'kitesurf', jsonb_build_object(
      'inscrits', COALESCE((SELECT SUM(taken) FROM grp WHERE activity='kitesurf'),0),
      'groupes', COALESCE((SELECT COUNT(*) FROM grp WHERE activity='kitesurf'),0),
      'places_restantes', CASE
        WHEN (SELECT COUNT(*) FROM grp WHERE activity='kitesurf') = 0
          THEN CASE WHEN (SELECT full_day FROM lim) THEN 0
                    ELSE public.default_max_participants('kitesurf'::activity_type) END
        ELSE COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='kitesurf'),0)
      END,
      'capacite_potentielle', CASE WHEN (SELECT full_day FROM lim) THEN 0
                    ELSE public.default_max_participants('kitesurf'::activity_type) END
    ),
    'wingfoil', jsonb_build_object(
      'inscrits', COALESCE((SELECT SUM(taken) FROM grp WHERE activity='wingfoil'),0),
      'groupes', COALESCE((SELECT COUNT(*) FROM grp WHERE activity='wingfoil'),0),
      'places_restantes', CASE
        WHEN (SELECT COUNT(*) FROM grp WHERE activity='wingfoil') = 0
          THEN CASE WHEN (SELECT full_day FROM lim) THEN 0
                    ELSE public.default_max_participants('wingfoil'::activity_type) END
        ELSE COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='wingfoil'),0)
      END,
      'capacite_potentielle', CASE WHEN (SELECT full_day FROM lim) THEN 0
                    ELSE public.default_max_participants('wingfoil'::activity_type) END
    ),
    'limite_jour_atteinte', (SELECT full_day FROM lim)
  )
$function$;