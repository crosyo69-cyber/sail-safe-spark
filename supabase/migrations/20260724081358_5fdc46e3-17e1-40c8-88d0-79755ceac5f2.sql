
-- 1) enforce_session_capacity: per-session, not slot-shared
CREATE OR REPLACE FUNCTION public.enforce_session_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session public.sessions;
  v_capacity int;
  v_count int;
  v_new_seats int;
  v_is_active boolean;
BEGIN
  SELECT * INTO v_session FROM public.sessions
   WHERE id = NEW.session_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'session_not_found'; END IF;

  IF TG_TABLE_NAME = 'reservations' THEN
    v_is_active := NEW.status <> 'cancelled';
    v_new_seats := COALESCE(NEW.participants, 1);
  ELSE
    v_is_active := NEW.status = 'confirmed';
    v_new_seats := 1;
  END IF;

  IF NOT v_is_active THEN RETURN NEW; END IF;

  IF v_session.status <> 'open' THEN
    IF TG_OP = 'UPDATE' THEN
      IF TG_TABLE_NAME = 'reservations' AND OLD.status <> 'cancelled' THEN RETURN NEW; END IF;
      IF TG_TABLE_NAME = 'package_bookings' AND OLD.status = 'confirmed' THEN RETURN NEW; END IF;
    END IF;
    RAISE EXCEPTION 'session_closed';
  END IF;

  -- Per-session capacity (one activity per session — see unique index date/slot/activity)
  v_capacity := v_session.max_participants;

  SELECT
    COALESCE((
      SELECT SUM(participants) FROM public.reservations
       WHERE session_id = v_session.id
         AND status <> 'cancelled'
         AND (TG_TABLE_NAME <> 'reservations' OR id <> NEW.id)
    ),0) +
    COALESCE((
      SELECT COUNT(*) FROM public.package_bookings
       WHERE session_id = v_session.id
         AND status = 'confirmed'
         AND (TG_TABLE_NAME <> 'package_bookings' OR id <> NEW.id)
    ),0)
  INTO v_count;

  IF (v_count + v_new_seats) > v_capacity THEN
    RAISE EXCEPTION 'session_full: capacity % exceeded (current=%, requested=%)',
      v_capacity, v_count, v_new_seats;
  END IF;

  -- Auto-close this session (only) when its own capacity is reached
  IF (v_count + v_new_seats) >= v_capacity THEN
    UPDATE public.sessions SET status = 'closed', updated_at = now()
     WHERE id = v_session.id AND status = 'open';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) book_session_with_code: per-session capacity
CREATE OR REPLACE FUNCTION public.book_session_with_code(p_code text, p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_session public.sessions;
  v_capacity int;
  v_count int;
  v_booking_id uuid;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
    WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok',false,'error','no_credits_left');
  END IF;

  SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','session_not_found'); END IF;
  IF v_session.activity <> v_pkg.activity THEN RETURN jsonb_build_object('ok',false,'error','activity_mismatch'); END IF;
  IF v_session.status <> 'open' THEN RETURN jsonb_build_object('ok',false,'error','session_closed'); END IF;
  IF v_session.date < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'error','session_in_past'); END IF;

  v_capacity := v_session.max_participants;

  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
              WHERE session_id = p_session_id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                WHERE session_id = p_session_id AND status = 'confirmed'),0)
  INTO v_count;

  IF v_count >= v_capacity THEN
    RETURN jsonb_build_object('ok',false,'error','session_full');
  END IF;

  INSERT INTO public.package_bookings (package_id, session_id, status, booking_kind)
    VALUES (v_pkg.id, p_session_id, 'confirmed', 'regular')
  ON CONFLICT (package_id, session_id) DO UPDATE
    SET status = 'confirmed', updated_at = now()
  RETURNING id INTO v_booking_id;

  PERFORM public.enqueue_booking_confirmation(v_booking_id);
  RETURN jsonb_build_object('ok',true,'booking_id',v_booking_id);
END;
$function$;

-- 3) book_stage_100_glisse: per-session capacity (stage sessions are their own activity)
CREATE OR REPLACE FUNCTION public.book_stage_100_glisse(p_code text, p_start_date date, p_time_slot time_slot DEFAULT 'morning'::time_slot)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_stage_group uuid := gen_random_uuid();
  v_day date;
  v_session_id uuid;
  v_capacity int;
  v_count int;
  v_booking_ids uuid[] := ARRAY[]::uuid[];
  v_booking_id uuid;
  v_i int;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
    WHERE package_code = p_code FOR UPDATE;
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

  FOR v_i IN 0..4 LOOP
    v_day := p_start_date + v_i;

    SELECT id INTO v_session_id FROM public.sessions
     WHERE date = v_day AND time_slot = p_time_slot
       AND activity = 'stage_100_glisse' AND status = 'open'
     LIMIT 1
     FOR UPDATE;

    IF v_session_id IS NULL THEN
      INSERT INTO public.sessions(date, time_slot, activity, max_participants, status, stage_group_id, notes)
        VALUES (v_day, p_time_slot, 'stage_100_glisse', 4, 'open', v_stage_group, 'Stage 100% Glisse')
        RETURNING id INTO v_session_id;
    ELSE
      UPDATE public.sessions SET stage_group_id = COALESCE(stage_group_id, v_stage_group)
       WHERE id = v_session_id;
    END IF;

    SELECT max_participants INTO v_capacity FROM public.sessions WHERE id = v_session_id;

    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                WHERE session_id = v_session_id AND status <> 'cancelled'),0)
      + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                  WHERE session_id = v_session_id AND status = 'confirmed'),0)
    INTO v_count;

    IF v_count >= v_capacity THEN
      RAISE EXCEPTION 'day_full:%', v_day;
    END IF;

    INSERT INTO public.package_bookings(package_id, session_id, status, booking_kind)
      VALUES (v_pkg.id, v_session_id, 'confirmed', 'regular')
    ON CONFLICT (package_id, session_id) DO UPDATE
      SET status = 'confirmed', booking_kind = 'regular', updated_at = now()
    RETURNING id INTO v_booking_id;

    v_booking_ids := array_append(v_booking_ids, v_booking_id);
  END LOOP;

  IF array_length(v_booking_ids,1) > 0 THEN
    PERFORM public.enqueue_booking_confirmation(v_booking_ids[1]);
  END IF;

  RETURN jsonb_build_object('ok',true,'stage_group_id',v_stage_group,'booking_ids',v_booking_ids);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok',false,'error',SQLERRM);
END;
$function$;

-- 4) admin_grant_weather_credit_booking: per-session capacity
CREATE OR REPLACE FUNCTION public.admin_grant_weather_credit_booking(p_package_id uuid, p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_session public.sessions;
  v_capacity int;
  v_count int;
  v_booking_id uuid;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','session_not_found'); END IF;
  IF v_session.status <> 'open' THEN RETURN jsonb_build_object('ok',false,'error','session_closed'); END IF;

  v_capacity := v_session.max_participants;
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
              WHERE session_id = p_session_id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                WHERE session_id = p_session_id AND status = 'confirmed'),0)
  INTO v_count;
  IF v_count >= v_capacity THEN RETURN jsonb_build_object('ok',false,'error','session_full'); END IF;

  INSERT INTO public.package_bookings(package_id, session_id, status, booking_kind)
    VALUES (p_package_id, p_session_id, 'confirmed', 'weather_credit')
  ON CONFLICT (package_id, session_id) DO UPDATE
    SET status = 'confirmed', booking_kind = 'weather_credit', updated_at = now()
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok',true,'booking_id',v_booking_id);
END;
$function$;

-- 5) get_slot_occupancy: return per-session snapshot for the stage preview flow.
--    Since the preview is used only for stage_100_glisse, scope to that activity.
CREATE OR REPLACE FUNCTION public.get_slot_occupancy(p_date date, p_slot time_slot)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH stage_sess AS (
    SELECT id, max_participants FROM public.sessions
     WHERE date = p_date AND time_slot = p_slot
       AND activity = 'stage_100_glisse' AND status <> 'cancelled'
     LIMIT 1
  )
  SELECT jsonb_build_object(
    'capacity', COALESCE((SELECT max_participants FROM stage_sess), 4),
    'stage', COALESCE((SELECT COUNT(*) FROM public.package_bookings pb
                        WHERE pb.session_id = (SELECT id FROM stage_sess)
                          AND pb.status = 'confirmed' AND pb.booking_kind = 'regular'), 0),
    'a_la_carte', 0,
    'weather', COALESCE((SELECT COUNT(*) FROM public.package_bookings pb
                          WHERE pb.session_id = (SELECT id FROM stage_sess)
                            AND pb.status = 'confirmed' AND pb.booking_kind = 'weather_credit'), 0),
    'taken', COALESCE((SELECT COUNT(*) FROM public.package_bookings pb
                        WHERE pb.session_id = (SELECT id FROM stage_sess)
                          AND pb.status = 'confirmed'), 0)
          + COALESCE((SELECT SUM(participants) FROM public.reservations r
                      WHERE r.session_id = (SELECT id FROM stage_sess)
                        AND r.status <> 'cancelled'), 0)
  )
$function$;
