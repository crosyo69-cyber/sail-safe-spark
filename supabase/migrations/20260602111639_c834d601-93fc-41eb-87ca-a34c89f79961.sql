-- 1) Trigger générique : verrouille la session et vérifie la capacité avant insert/update
CREATE OR REPLACE FUNCTION public.enforce_session_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_session public.sessions;
  v_session_id uuid;
  v_count int;
  v_new_seats int;
  v_is_active boolean;
BEGIN
  v_session_id := NEW.session_id;

  -- Verrou exclusif sur la session : sérialise les inserts/updates concurrents
  SELECT * INTO v_session
    FROM public.sessions
   WHERE id = v_session_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found';
  END IF;

  -- Déterminer si la ligne NEW compte comme "occupant une place"
  IF TG_TABLE_NAME = 'reservations' THEN
    v_is_active := NEW.status <> 'cancelled';
    v_new_seats := COALESCE(NEW.participants, 1);
  ELSE -- package_bookings
    v_is_active := NEW.status = 'confirmed';
    v_new_seats := 1;
  END IF;

  IF NOT v_is_active THEN
    RETURN NEW;
  END IF;

  -- Refuser si la session n'est pas ouverte (sauf si on ne fait que recalculer un update neutre)
  IF v_session.status <> 'open' THEN
    -- autoriser UPDATE qui ne change rien d'actif
    IF TG_OP = 'UPDATE' THEN
      IF TG_TABLE_NAME = 'reservations' AND OLD.status <> 'cancelled' THEN
        RETURN NEW;
      ELSIF TG_TABLE_NAME = 'package_bookings' AND OLD.status = 'confirmed' THEN
        RETURN NEW;
      END IF;
    END IF;
    RAISE EXCEPTION 'session_closed';
  END IF;

  -- Compter les places occupées (en excluant la ligne courante si UPDATE)
  SELECT
    COALESCE((
      SELECT SUM(participants) FROM public.reservations
       WHERE session_id = v_session_id
         AND status <> 'cancelled'
         AND (TG_TABLE_NAME <> 'reservations' OR id <> NEW.id)
    ), 0)
    +
    COALESCE((
      SELECT COUNT(*) FROM public.package_bookings
       WHERE session_id = v_session_id
         AND status = 'confirmed'
         AND (TG_TABLE_NAME <> 'package_bookings' OR id <> NEW.id)
    ), 0)
  INTO v_count;

  IF (v_count + v_new_seats) > v_session.max_participants THEN
    RAISE EXCEPTION 'session_full: capacity % exceeded (current=%, requested=%)',
      v_session.max_participants, v_count, v_new_seats;
  END IF;

  -- Si la session devient pleine, la fermer immédiatement
  IF (v_count + v_new_seats) >= v_session.max_participants THEN
    UPDATE public.sessions
       SET status = 'closed', updated_at = now()
     WHERE id = v_session_id AND status = 'open';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Brancher les triggers BEFORE INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_enforce_capacity_reservations ON public.reservations;
CREATE TRIGGER trg_enforce_capacity_reservations
  BEFORE INSERT OR UPDATE OF status, participants, session_id ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_capacity();

DROP TRIGGER IF EXISTS trg_enforce_capacity_package_bookings ON public.package_bookings;
CREATE TRIGGER trg_enforce_capacity_package_bookings
  BEFORE INSERT OR UPDATE OF status, session_id ON public.package_bookings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_session_capacity();

-- 3) Mettre à jour book_session_with_code pour utiliser le même verrou
CREATE OR REPLACE FUNCTION public.book_session_with_code(p_code text, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pkg public.client_packages;
  v_session public.sessions;
  v_current_count integer;
  v_booking_id uuid;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_pkg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'package_not_active');
  END IF;
  IF v_pkg.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'package_expired');
  END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_credits_left');
  END IF;

  -- Verrou exclusif sur la session pour sérialiser les concurrents
  SELECT * INTO v_session FROM public.sessions
    WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;
  IF v_session.activity <> v_pkg.activity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'activity_mismatch');
  END IF;
  IF v_session.status <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_closed');
  END IF;
  IF v_session.date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_in_past');
  END IF;

  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
               WHERE session_id = p_session_id AND status <> 'cancelled'), 0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE session_id = p_session_id AND status = 'confirmed'), 0)
  INTO v_current_count;

  IF v_current_count >= v_session.max_participants THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_full');
  END IF;

  BEGIN
    INSERT INTO public.package_bookings (package_id, session_id, status)
      VALUES (v_pkg.id, p_session_id, 'confirmed')
    ON CONFLICT (package_id, session_id) DO UPDATE
      SET status = 'confirmed', updated_at = now()
    RETURNING id INTO v_booking_id;
  EXCEPTION WHEN OTHERS THEN
    -- Le trigger enforce_session_capacity peut lever 'session_full' ou 'session_closed'
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;