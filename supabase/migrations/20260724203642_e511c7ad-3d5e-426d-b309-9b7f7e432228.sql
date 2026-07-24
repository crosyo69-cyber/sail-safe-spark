
-- Phase 3 admin: outillage de gestion des journées dynamiques

-- Annuler intégralement un groupe (toutes les inscriptions passent en cancelled).
-- Les crédits pack sont restitués automatiquement via sync_package_used_sessions.
CREATE OR REPLACE FUNCTION public.admin_cancel_daily_group(
  p_group_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.daily_groups;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT * INTO v_group FROM public.daily_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE daily_group_id = p_group_id AND status = 'confirmed';

  UPDATE public.reservations
     SET status = 'cancelled'
   WHERE daily_group_id = p_group_id AND status <> 'cancelled';

  UPDATE public.daily_groups
     SET status = 'cancelled',
         notes = COALESCE(NULLIF(TRIM(COALESCE(notes,'') || E'\n' || COALESCE('Annulé: '||p_reason,'')), ''), notes),
         updated_at = now()
   WHERE id = p_group_id;

  PERFORM public.enqueue_admin_notification(
    'daily_group_cancelled', 'warning',
    'Groupe annulé — ' || v_group.activity::text,
    to_char(v_group.date,'DD/MM/YYYY') || ' · groupe #' || v_group.group_index
      || COALESCE(' · ' || p_reason, ''),
    jsonb_build_object('group_id', p_group_id, 'date', v_group.date,
                       'activity', v_group.activity, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Mise à jour d'un groupe (capacité, notes, statut)
CREATE OR REPLACE FUNCTION public.admin_update_daily_group(
  p_group_id UUID,
  p_max_participants INT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.daily_groups;
  v_taken INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT * INTO v_group FROM public.daily_groups WHERE id = p_group_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;

  IF p_max_participants IS NOT NULL THEN
    SELECT COALESCE((SELECT SUM(participants) FROM public.reservations
                     WHERE daily_group_id = p_group_id AND status <> 'cancelled'),0)
         + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                     WHERE daily_group_id = p_group_id AND status = 'confirmed'),0)
      INTO v_taken;
    IF p_max_participants < v_taken THEN
      RAISE EXCEPTION 'capacity_below_taken: % occupied', v_taken;
    END IF;
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('open','closed','cancelled') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  UPDATE public.daily_groups
     SET max_participants = COALESCE(p_max_participants, max_participants),
         notes = COALESCE(p_notes, notes),
         status = COALESCE(p_status, status),
         updated_at = now()
   WHERE id = p_group_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Retirer un membre d'un groupe (annule la réservation / booking correspondant)
CREATE OR REPLACE FUNCTION public.admin_remove_group_member(
  p_kind TEXT,           -- 'visitor' | 'package'
  p_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF p_kind = 'visitor' THEN
    UPDATE public.reservations SET status = 'cancelled' WHERE id = p_id;
  ELSIF p_kind = 'package' THEN
    UPDATE public.package_bookings SET status = 'cancelled', updated_at = now() WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Déplacer un membre vers une autre date (même activité)
CREATE OR REPLACE FUNCTION public.admin_move_group_member(
  p_kind TEXT,           -- 'visitor' | 'package'
  p_id UUID,
  p_new_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity activity_type;
  v_seats INT := 1;
  v_new_group UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_new_date < CURRENT_DATE THEN RAISE EXCEPTION 'date_in_past'; END IF;

  IF p_kind = 'visitor' THEN
    SELECT dg.activity, r.participants INTO v_activity, v_seats
      FROM public.reservations r
      JOIN public.daily_groups dg ON dg.id = r.daily_group_id
     WHERE r.id = p_id;
    IF v_activity IS NULL THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
    v_new_group := public.find_or_create_daily_group(p_new_date, v_activity, GREATEST(v_seats,1));
    UPDATE public.reservations SET daily_group_id = v_new_group WHERE id = p_id;
  ELSIF p_kind = 'package' THEN
    SELECT dg.activity INTO v_activity
      FROM public.package_bookings pb
      JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
     WHERE pb.id = p_id;
    IF v_activity IS NULL THEN RAISE EXCEPTION 'booking_not_found'; END IF;
    v_new_group := public.find_or_create_daily_group(p_new_date, v_activity, 1);
    UPDATE public.package_bookings SET daily_group_id = v_new_group, updated_at = now() WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  RETURN jsonb_build_object('ok', true, 'new_group_id', v_new_group);
END;
$$;

-- Vue mensuelle : liste synthétique des journées avec compteurs par activité
CREATE OR REPLACE FUNCTION public.admin_list_daily_groups_range(
  p_start DATE,
  p_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.date, t.activity, t.group_index), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT dg.id, dg.date, dg.activity, dg.group_index, dg.max_participants, dg.status,
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0) AS taken
    FROM public.daily_groups dg
    WHERE dg.date BETWEEN p_start AND p_end
  ) t;

  RETURN v_result;
END;
$$;
