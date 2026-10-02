
-- 1. Colonnes additionnelles
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS stage_group_id uuid;
CREATE INDEX IF NOT EXISTS idx_sessions_stage_group ON public.sessions(stage_group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date_slot ON public.sessions(date, time_slot);

ALTER TABLE public.package_bookings
  ADD COLUMN IF NOT EXISTS booking_kind text NOT NULL DEFAULT 'regular';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='package_bookings_kind_chk') THEN
    ALTER TABLE public.package_bookings
      ADD CONSTRAINT package_bookings_kind_chk CHECK (booking_kind IN ('regular','weather_credit'));
  END IF;
END $$;

-- 2. Table de capacité partagée par jour/créneau
CREATE TABLE IF NOT EXISTS public.daily_slot_capacity (
  date date NOT NULL,
  time_slot public.time_slot NOT NULL,
  max_participants integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, time_slot)
);

GRANT SELECT ON public.daily_slot_capacity TO anon, authenticated;
GRANT ALL ON public.daily_slot_capacity TO service_role;

ALTER TABLE public.daily_slot_capacity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read slot capacity" ON public.daily_slot_capacity;
CREATE POLICY "Public can read slot capacity"
  ON public.daily_slot_capacity FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage slot capacity" ON public.daily_slot_capacity;
CREATE POLICY "Admins manage slot capacity"
  ON public.daily_slot_capacity FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_daily_slot_capacity_updated_at ON public.daily_slot_capacity;
CREATE TRIGGER trg_daily_slot_capacity_updated_at
  BEFORE UPDATE ON public.daily_slot_capacity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Helper : capacité effective d'un slot (table override sinon plus petit max_participants des sessions du slot)
CREATE OR REPLACE FUNCTION public.get_slot_capacity(p_date date, p_slot public.time_slot)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT max_participants FROM public.daily_slot_capacity
      WHERE date = p_date AND time_slot = p_slot),
    (SELECT MIN(max_participants) FROM public.sessions
      WHERE date = p_date AND time_slot = p_slot),
    4
  )
$$;

-- 4. Compte d'occupation partagée d'un slot
CREATE OR REPLACE FUNCTION public.get_slot_occupancy(p_date date, p_slot public.time_slot)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH slot_sessions AS (
    SELECT id, activity FROM public.sessions
     WHERE date = p_date AND time_slot = p_slot AND status <> 'cancelled'
  ),
  res AS (
    SELECT COALESCE(SUM(participants),0) AS n
      FROM public.reservations r
     WHERE r.session_id IN (SELECT id FROM slot_sessions)
       AND r.status <> 'cancelled'
  ),
  pb AS (
    SELECT
      COUNT(*) FILTER (WHERE booking_kind='regular'
                       AND EXISTS (SELECT 1 FROM slot_sessions s
                                    WHERE s.id = pb.session_id AND s.activity = 'stage_100_glisse'))
        AS stage,
      COUNT(*) FILTER (WHERE booking_kind='regular'
                       AND EXISTS (SELECT 1 FROM slot_sessions s
                                    WHERE s.id = pb.session_id AND s.activity <> 'stage_100_glisse'))
        AS a_la_carte,
      COUNT(*) FILTER (WHERE booking_kind='weather_credit') AS weather
      FROM public.package_bookings pb
     WHERE pb.session_id IN (SELECT id FROM slot_sessions)
       AND pb.status = 'confirmed'
  )
  SELECT jsonb_build_object(
    'capacity', public.get_slot_capacity(p_date, p_slot),
    'stage', COALESCE((SELECT stage FROM pb),0),
    'a_la_carte', COALESCE((SELECT a_la_carte FROM pb),0) + COALESCE((SELECT n FROM res),0),
    'weather', COALESCE((SELECT weather FROM pb),0),
    'taken', COALESCE((SELECT stage FROM pb),0) + COALESCE((SELECT a_la_carte FROM pb),0)
           + COALESCE((SELECT weather FROM pb),0) + COALESCE((SELECT n FROM res),0)
  )
$$;

-- 5. Trigger de capacité partagée (remplace l'ancien)
CREATE OR REPLACE FUNCTION public.enforce_session_capacity()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
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

  v_capacity := public.get_slot_capacity(v_session.date, v_session.time_slot);

  -- Lock all sessions on the same (date, slot) to serialize concurrent inserts
  PERFORM 1 FROM public.sessions
   WHERE date = v_session.date AND time_slot = v_session.time_slot
   FOR UPDATE;

  WITH slot_sessions AS (
    SELECT id FROM public.sessions
     WHERE date = v_session.date AND time_slot = v_session.time_slot
       AND status <> 'cancelled'
  )
  SELECT
    COALESCE((
      SELECT SUM(participants) FROM public.reservations
       WHERE session_id IN (SELECT id FROM slot_sessions)
         AND status <> 'cancelled'
         AND (TG_TABLE_NAME <> 'reservations' OR id <> NEW.id)
    ),0) +
    COALESCE((
      SELECT COUNT(*) FROM public.package_bookings
       WHERE session_id IN (SELECT id FROM slot_sessions)
         AND status = 'confirmed'
         AND (TG_TABLE_NAME <> 'package_bookings' OR id <> NEW.id)
    ),0)
  INTO v_count;

  IF (v_count + v_new_seats) > v_capacity THEN
    RAISE EXCEPTION 'slot_full: capacity % exceeded (current=%, requested=%)',
      v_capacity, v_count, v_new_seats;
  END IF;

  -- Ferme automatiquement toutes les sessions du slot si plein
  IF (v_count + v_new_seats) >= v_capacity THEN
    UPDATE public.sessions SET status = 'closed', updated_at = now()
     WHERE date = v_session.date AND time_slot = v_session.time_slot
       AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$;

-- 6. auto_close_full_session : utilise la capacité partagée
CREATE OR REPLACE FUNCTION public.auto_close_full_session()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_capacity int;
  v_count int;
BEGIN
  SELECT * INTO v_session FROM public.sessions
   WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_capacity := public.get_slot_capacity(v_session.date, v_session.time_slot);

  WITH slot_sessions AS (
    SELECT id FROM public.sessions
     WHERE date = v_session.date AND time_slot = v_session.time_slot
       AND status <> 'cancelled'
  )
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
              WHERE session_id IN (SELECT id FROM slot_sessions)
                AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                WHERE session_id IN (SELECT id FROM slot_sessions)
                  AND status = 'confirmed'),0)
  INTO v_count;

  IF v_count >= v_capacity THEN
    UPDATE public.sessions SET status = 'closed', updated_at = now()
     WHERE date = v_session.date AND time_slot = v_session.time_slot
       AND status = 'open';
  END IF;
  RETURN NEW;
END;
$$;

-- 7. book_session_with_code : capacité partagée
CREATE OR REPLACE FUNCTION public.book_session_with_code(p_code text, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  v_capacity := public.get_slot_capacity(v_session.date, v_session.time_slot);

  WITH slot_sessions AS (
    SELECT id FROM public.sessions
     WHERE date = v_session.date AND time_slot = v_session.time_slot
       AND status <> 'cancelled'
  )
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
              WHERE session_id IN (SELECT id FROM slot_sessions) AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                WHERE session_id IN (SELECT id FROM slot_sessions) AND status = 'confirmed'),0)
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
$$;

-- 8. book_stage_100_glisse : 5 jours consécutifs
CREATE OR REPLACE FUNCTION public.book_stage_100_glisse(
  p_code text,
  p_start_date date,
  p_time_slot public.time_slot DEFAULT 'morning'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

    -- find or create the stage session for that day
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

    v_capacity := public.get_slot_capacity(v_day, p_time_slot);

    WITH slot_sessions AS (
      SELECT id FROM public.sessions
       WHERE date = v_day AND time_slot = p_time_slot AND status <> 'cancelled'
    )
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                WHERE session_id IN (SELECT id FROM slot_sessions) AND status <> 'cancelled'),0)
      + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                  WHERE session_id IN (SELECT id FROM slot_sessions) AND status = 'confirmed'),0)
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

  -- Email confirmation on first booking only
  IF array_length(v_booking_ids,1) > 0 THEN
    PERFORM public.enqueue_booking_confirmation(v_booking_ids[1]);
  END IF;

  RETURN jsonb_build_object('ok',true,'stage_group_id',v_stage_group,'booking_ids',v_booking_ids);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok',false,'error',SQLERRM);
END;
$$;

-- 9. admin_grant_weather_credit_booking : crédit météo offert par l'admin
CREATE OR REPLACE FUNCTION public.admin_grant_weather_credit_booking(
  p_package_id uuid,
  p_session_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  v_capacity := public.get_slot_capacity(v_session.date, v_session.time_slot);
  WITH slot_sessions AS (
    SELECT id FROM public.sessions
     WHERE date = v_session.date AND time_slot = v_session.time_slot AND status <> 'cancelled'
  )
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
              WHERE session_id IN (SELECT id FROM slot_sessions) AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                WHERE session_id IN (SELECT id FROM slot_sessions) AND status = 'confirmed'),0)
  INTO v_count;
  IF v_count >= v_capacity THEN RETURN jsonb_build_object('ok',false,'error','session_full'); END IF;

  INSERT INTO public.package_bookings(package_id, session_id, status, booking_kind)
    VALUES (p_package_id, p_session_id, 'confirmed', 'weather_credit')
  ON CONFLICT (package_id, session_id) DO UPDATE
    SET status = 'confirmed', booking_kind = 'weather_credit', updated_at = now()
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok',true,'booking_id',v_booking_id);
END;
$$;

-- 10. sync_package_used_sessions : ne pas débiter pour les weather_credit
CREATE OR REPLACE FUNCTION public.sync_package_used_sessions()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_delta int := 0;
  v_kind text;
  v_booking_id uuid;
  v_is_weather boolean;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_kind = 'regular' THEN
    v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
    UPDATE public.client_packages SET used_sessions = used_sessions + 1
      WHERE id = NEW.package_id RETURNING * INTO v_pkg;
  ELSIF TG_OP = 'UPDATE' THEN
    v_is_weather := NEW.booking_kind = 'weather_credit' OR OLD.booking_kind = 'weather_credit';
    IF NOT v_is_weather THEN
      IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        v_delta := 1; v_kind := 'cancellation'; v_booking_id := NEW.id;
        UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
          WHERE id = NEW.package_id RETURNING * INTO v_pkg;
      ELSIF OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
        v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
        UPDATE public.client_packages SET used_sessions = used_sessions + 1
          WHERE id = NEW.package_id RETURNING * INTO v_pkg;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' AND OLD.booking_kind = 'regular' THEN
    v_delta := 1; v_kind := 'cancellation'; v_booking_id := OLD.id;
    UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
      WHERE id = OLD.package_id RETURNING * INTO v_pkg;
  END IF;

  IF v_delta <> 0 AND v_pkg.id IS NOT NULL THEN
    INSERT INTO public.package_credit_history
      (package_id, delta, kind, reason, booking_id, balance_after)
    VALUES
      (v_pkg.id, v_delta, v_kind,
       CASE v_kind WHEN 'booking' THEN 'Inscription à une session'
                   WHEN 'cancellation' THEN 'Annulation d''une session' END,
       v_booking_id,
       v_pkg.total_sessions - v_pkg.used_sessions);

    IF v_delta < 0 AND (v_pkg.total_sessions - v_pkg.used_sessions) = 1 THEN
      PERFORM public.enqueue_low_credit_warning(v_pkg.id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 11. validate_client_package_sessions : accepter activity stage_100_glisse
CREATE OR REPLACE FUNCTION public.validate_client_package_sessions()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  v_type text := lower(coalesce(NEW.package_type, ''));
  v_activity text := NEW.activity::text;
  v_allowed int[];
BEGIN
  IF NEW.total_sessions IS NULL OR NEW.total_sessions < 1 THEN
    RAISE EXCEPTION 'total_sessions must be >= 1';
  END IF;

  IF v_activity = 'stage_100_glisse' THEN
    v_allowed := ARRAY[5];
  ELSIF v_type LIKE '%carte%' THEN
    v_allowed := ARRAY[1,3,5,10];
  ELSIF v_type LIKE '%wingfoil%' THEN
    v_allowed := ARRAY[1,3,5];
  ELSIF v_type LIKE '%stage 100%' OR v_type LIKE '%100%glisse%' THEN
    v_allowed := ARRAY[5];
  ELSE
    v_allowed := ARRAY[1,2,3,4,5,6];
  END IF;

  IF NOT (NEW.total_sessions = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid total_sessions % for package_type "%": allowed values are %',
      NEW.total_sessions, NEW.package_type, v_allowed;
  END IF;

  RETURN NEW;
END;
$$;
