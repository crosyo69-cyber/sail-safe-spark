
-- =========================================================================
-- Refonte : suppression des créneaux horaires, groupes dynamiques journaliers
-- =========================================================================

-- 1) Table daily_groups : un groupe = (date, activité, index).
--    Créé à la volée par la première réservation. Capacité selon activité.
CREATE TABLE public.daily_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  activity activity_type NOT NULL,
  group_index INT NOT NULL,
  max_participants INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, activity, group_index)
);

GRANT SELECT ON public.daily_groups TO anon, authenticated;
GRANT ALL ON public.daily_groups TO service_role;
ALTER TABLE public.daily_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_groups"
  ON public.daily_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins manage daily_groups"
  ON public.daily_groups FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_daily_groups_updated_at
  BEFORE UPDATE ON public.daily_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_daily_groups_date ON public.daily_groups(date);

-- 2) Colonnes de liaison vers daily_groups (nullable, coexistent avec session_id historique)
ALTER TABLE public.package_bookings
  ADD COLUMN daily_group_id UUID REFERENCES public.daily_groups(id) ON DELETE CASCADE;
ALTER TABLE public.reservations
  ADD COLUMN daily_group_id UUID REFERENCES public.daily_groups(id) ON DELETE CASCADE;
ALTER TABLE public.reservations
  ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE public.package_bookings
  ALTER COLUMN session_id DROP NOT NULL;

CREATE INDEX idx_package_bookings_daily_group ON public.package_bookings(daily_group_id);
CREATE INDEX idx_reservations_daily_group ON public.reservations(daily_group_id);

-- 3) Capacité par activité
CREATE OR REPLACE FUNCTION public.default_max_participants(_activity activity_type)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _activity
    WHEN 'kitesurf' THEN 4
    WHEN 'wingfoil' THEN 3
    WHEN 'pumpfoil' THEN 4
    WHEN 'foil_tracte' THEN 4
    WHEN 'stage_100_glisse' THEN 4
    ELSE 4
  END
$$;

-- 4) RPC : trouver ou créer le premier groupe non plein pour (date, activity)
CREATE OR REPLACE FUNCTION public.find_or_create_daily_group(
  p_date DATE,
  p_activity activity_type,
  p_seats INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.daily_groups;
  v_cap INT := public.default_max_participants(p_activity);
  v_taken INT;
  v_next_index INT;
BEGIN
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'date_in_past';
  END IF;

  -- Cherche le premier groupe ouvert avec de la place pour cette activité/date
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

  -- Sinon on crée un nouveau groupe
  SELECT COALESCE(MAX(group_index),0) + 1 INTO v_next_index
    FROM public.daily_groups WHERE date = p_date AND activity = p_activity;

  INSERT INTO public.daily_groups(date, activity, group_index, max_participants, status)
    VALUES (p_date, p_activity, v_next_index, v_cap, 'open')
  RETURNING id INTO v_group.id;

  RETURN v_group.id;
END;
$$;

-- 5) RPC de réservation par pack (nouveau flux)
CREATE OR REPLACE FUNCTION public.book_daily_with_code(
  p_code TEXT,
  p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_group_id UUID;
  v_booking_id UUID;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok',false,'error','no_credits_left');
  END IF;
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'error','date_in_past'); END IF;

  -- Empêche double réservation pour la même date/pack
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

-- 6) RPC pour créer une réservation visiteur (paiement Stripe)
CREATE OR REPLACE FUNCTION public.book_daily_visitor(
  p_date DATE,
  p_activity activity_type,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_participants INT,
  p_stripe_session_id TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
  v_res_id UUID;
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing FROM public.reservations
   WHERE stripe_session_id = p_stripe_session_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok',true,'already_synced',true,'reservation_id',v_existing);
  END IF;

  v_group_id := public.find_or_create_daily_group(p_date, p_activity, GREATEST(p_participants,1));

  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, stripe_session_id, notes
  ) VALUES (
    v_group_id, p_first_name, p_last_name, p_email, p_phone,
    'debutant', GREATEST(p_participants,1), 'confirmed', p_stripe_session_id, p_notes
  ) RETURNING id INTO v_res_id;

  RETURN jsonb_build_object('ok',true,'reservation_id',v_res_id,'daily_group_id',v_group_id);
END;
$$;

-- 7) RPC : disponibilité d'une journée (pour la vue admin)
CREATE OR REPLACE FUNCTION public.get_daily_availability(p_date DATE)
RETURNS JSONB
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH grp AS (
    SELECT dg.id, dg.activity, dg.max_participants,
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0) AS taken
    FROM public.daily_groups dg
    WHERE dg.date = p_date AND dg.status = 'open'
  )
  SELECT jsonb_build_object(
    'kitesurf', jsonb_build_object(
      'inscrits', COALESCE((SELECT SUM(taken) FROM grp WHERE activity='kitesurf'),0),
      'groupes', COALESCE((SELECT COUNT(*) FROM grp WHERE activity='kitesurf'),0),
      'places_restantes', COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='kitesurf'),0),
      'capacite_potentielle', 4
    ),
    'wingfoil', jsonb_build_object(
      'inscrits', COALESCE((SELECT SUM(taken) FROM grp WHERE activity='wingfoil'),0),
      'groupes', COALESCE((SELECT COUNT(*) FROM grp WHERE activity='wingfoil'),0),
      'places_restantes', COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='wingfoil'),0),
      'capacite_potentielle', 3
    )
  )
$$;

-- 8) Mise à jour du trigger de capacité pour supporter daily_group_id
CREATE OR REPLACE FUNCTION public.enforce_daily_group_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_group public.daily_groups;
  v_count INT;
  v_new_seats INT;
  v_is_active BOOLEAN;
BEGIN
  IF NEW.daily_group_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_group FROM public.daily_groups
   WHERE id = NEW.daily_group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'daily_group_not_found'; END IF;

  IF TG_TABLE_NAME = 'reservations' THEN
    v_is_active := NEW.status <> 'cancelled';
    v_new_seats := COALESCE(NEW.participants, 1);
  ELSE
    v_is_active := NEW.status = 'confirmed';
    v_new_seats := 1;
  END IF;

  IF NOT v_is_active THEN RETURN NEW; END IF;

  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
               WHERE daily_group_id = v_group.id AND status <> 'cancelled'
               AND (TG_TABLE_NAME <> 'reservations' OR id <> NEW.id)),0)
  + COALESCE((SELECT COUNT(*) FROM public.package_bookings
               WHERE daily_group_id = v_group.id AND status = 'confirmed'
               AND (TG_TABLE_NAME <> 'package_bookings' OR id <> NEW.id)),0)
  INTO v_count;

  IF (v_count + v_new_seats) > v_group.max_participants THEN
    RAISE EXCEPTION 'group_full: capacity % exceeded (current=%, requested=%)',
      v_group.max_participants, v_count, v_new_seats;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_capacity_reservations_dg
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW WHEN (NEW.daily_group_id IS NOT NULL)
  EXECUTE FUNCTION public.enforce_daily_group_capacity();

CREATE TRIGGER trg_enforce_capacity_bookings_dg
  BEFORE INSERT OR UPDATE ON public.package_bookings
  FOR EACH ROW WHEN (NEW.daily_group_id IS NOT NULL)
  EXECUTE FUNCTION public.enforce_daily_group_capacity();

-- 9) Mise à jour de sync_package_used_sessions pour gérer les bookings sans session_id
--    (le trigger existant utilise NEW.session_id : on le rend tolérant à NULL)
--    -> pas de changement nécessaire, la logique se base sur package_id et statut.

-- 10) Adapter get_package_by_code pour retourner la date via daily_group
CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_bookings JSONB;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'daily_group_id', b.daily_group_id,
    'session_id', b.session_id,
    'status', b.status,
    'date', COALESCE(dg.date, s.date),
    'activity', COALESCE(dg.activity::text, s.activity::text),
    'created_at', b.created_at
  ) ORDER BY COALESCE(dg.date, s.date)), '[]'::jsonb)
  INTO v_bookings
  FROM public.package_bookings b
  LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
  LEFT JOIN public.sessions s ON s.id = b.session_id
  WHERE b.package_id = v_pkg.id;

  RETURN jsonb_build_object(
    'id', v_pkg.id,
    'package_code', v_pkg.package_code,
    'first_name', v_pkg.first_name,
    'last_name', v_pkg.last_name,
    'email', v_pkg.email,
    'activity', v_pkg.activity,
    'package_type', v_pkg.package_type,
    'total_sessions', v_pkg.total_sessions,
    'used_sessions', v_pkg.used_sessions,
    'remaining_sessions', v_pkg.total_sessions - v_pkg.used_sessions,
    'status', v_pkg.status,
    'expires_at', v_pkg.expires_at,
    'deposit_amount', v_pkg.deposit_amount,
    'bookings', v_bookings
  );
END;
$$;

-- 11) Backfill : convertir les sessions futures ouvertes en daily_groups + rattacher les bookings
DO $$
DECLARE
  v_sess RECORD;
  v_group_id UUID;
  v_next_index INT;
BEGIN
  FOR v_sess IN
    SELECT * FROM public.sessions
     WHERE date >= CURRENT_DATE
       AND activity IN ('kitesurf','wingfoil')
     ORDER BY date, time_slot
  LOOP
    SELECT COALESCE(MAX(group_index),0) + 1 INTO v_next_index
      FROM public.daily_groups
     WHERE date = v_sess.date AND activity = v_sess.activity;

    INSERT INTO public.daily_groups(date, activity, group_index, max_participants, status, notes)
      VALUES (v_sess.date, v_sess.activity, v_next_index,
              public.default_max_participants(v_sess.activity),
              CASE WHEN v_sess.status = 'open' THEN 'open' ELSE 'closed' END,
              'Migré depuis session ' || v_sess.id::text)
    RETURNING id INTO v_group_id;

    UPDATE public.package_bookings SET daily_group_id = v_group_id
     WHERE session_id = v_sess.id AND daily_group_id IS NULL;
    UPDATE public.reservations SET daily_group_id = v_group_id
     WHERE session_id = v_sess.id AND daily_group_id IS NULL;
  END LOOP;
END $$;

-- 12) Admin RPC : liste des groupes d'une date (pour la vue admin)
CREATE OR REPLACE FUNCTION public.admin_list_daily_groups(p_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', dg.id,
    'activity', dg.activity,
    'group_index', dg.group_index,
    'max_participants', dg.max_participants,
    'status', dg.status,
    'notes', dg.notes,
    'taken',
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0),
    'members', (
      SELECT COALESCE(jsonb_agg(m ORDER BY m->>'name'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'kind','visitor','id',r.id,
          'name', r.first_name || ' ' || r.last_name,
          'email', r.email, 'phone', r.phone,
          'participants', r.participants
        ) AS m
        FROM public.reservations r
        WHERE r.daily_group_id = dg.id AND r.status <> 'cancelled'
        UNION ALL
        SELECT jsonb_build_object(
          'kind','package','id',pb.id,
          'name', cp.first_name || ' ' || cp.last_name,
          'email', cp.email, 'phone', cp.phone,
          'package_code', cp.package_code,
          'participants', 1
        )
        FROM public.package_bookings pb
        JOIN public.client_packages cp ON cp.id = pb.package_id
        WHERE pb.daily_group_id = dg.id AND pb.status = 'confirmed'
      ) t
    )
  ) ORDER BY dg.activity, dg.group_index), '[]'::jsonb)
  INTO v_result
  FROM public.daily_groups dg
  WHERE dg.date = p_date;

  RETURN v_result;
END;
$$;
