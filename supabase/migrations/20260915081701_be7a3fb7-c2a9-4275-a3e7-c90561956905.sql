-- F-27-03-01 — Contrôle serveur d'unicité des dates pour le Stage 100% Glisse.
-- Unique changement : ajout d'un contrôle de conflit de dates après le verrou
-- client_packages FOR UPDATE et AVANT toute création de booking / consommation
-- de crédit. Reste strictement identique : verrou pack, advisory lock F-26-02
-- (via find_or_create_daily_group), pré-check capacité, triggers, notes, e-mail.
CREATE OR REPLACE FUNCTION public.book_stage_for_package(p_package_id uuid, p_start_date date)
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

  -- F-27-03-01 : aucune des 5 journées ne doit déjà être réservée par ce pack.
  -- Même règle d'état que le parcours nominal (book_daily_with_session) :
  -- seuls les package_bookings 'confirmed' constituent un conflit ; les
  -- bookings 'cancelled' libèrent la date. Exécuté sous le verrou
  -- client_packages FOR UPDATE : deux appels concurrents sur le même pack sont
  -- sérialisés, le second voit les bookings commités du premier et refuse.
  IF EXISTS (
    SELECT 1
      FROM public.package_bookings pb
      JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
     WHERE pb.package_id = v_pkg.id
       AND pb.status = 'confirmed'
       AND dg.date BETWEEN p_start_date AND (p_start_date + 4)
  ) THEN
    RETURN jsonb_build_object('ok',false,'error','stage_date_conflict');
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