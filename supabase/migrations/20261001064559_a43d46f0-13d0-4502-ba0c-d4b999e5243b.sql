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

  -- F-27-03-03 : pré-check supprimé. La capacité est garantie par
  -- find_or_create_daily_group (verrou F-26-02 + choix du groupe) et par le
  -- trigger enforce_daily_group_capacity à l'INSERT (rollback total si plein).
  FOR v_i IN 0..4 LOOP
    v_day := p_start_date + v_i;

    v_group_id := public.find_or_create_daily_group(v_day, 'stage_100_glisse', 1);

    UPDATE public.daily_groups
       SET notes = COALESCE(notes, '') ||
                   CASE WHEN COALESCE(notes,'') = '' THEN '' ELSE E'\n' END ||
                   'Stage 100% Glisse - ID:' || v_stage_group::text
     WHERE id = v_group_id
       AND (notes IS NULL OR notes NOT LIKE '%Stage 100%% Glisse - ID:' || v_stage_group::text || '%');

    -- F-27-03-02 : rattachement persistant de chaque journée à son stage.
    INSERT INTO public.package_bookings(package_id, daily_group_id, status, booking_kind, stage_group_id)
      VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular', v_stage_group)
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