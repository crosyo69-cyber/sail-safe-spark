-- F-28-06 : les déplacements/reports admin d'une réservation à-la-carte Kitesurf
-- passent par find_or_create_compatible_group (jamais de groupe Stage vide ni créé).
-- Les autres activités et les packs gardent find_or_create_daily_group(activité du groupe).
CREATE OR REPLACE FUNCTION public.admin_move_group_member(p_kind text, p_id uuid, p_new_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_activity activity_type;
  v_client_activity activity_type;
  v_seats INT := 1;
  v_new_group UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_new_date < CURRENT_DATE THEN RAISE EXCEPTION 'date_in_past'; END IF;

  IF p_kind = 'visitor' THEN
    SELECT dg.activity, r.client_activity, r.participants INTO v_activity, v_client_activity, v_seats
      FROM public.reservations r
      JOIN public.daily_groups dg ON dg.id = r.daily_group_id
     WHERE r.id = p_id;
    IF v_activity IS NULL THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
    IF v_client_activity = 'kitesurf' THEN
      v_new_group := public.find_or_create_compatible_group(p_new_date, 'kitesurf', GREATEST(v_seats,1));
    ELSE
      v_new_group := public.find_or_create_daily_group(p_new_date, v_activity, GREATEST(v_seats,1));
    END IF;
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_reschedule_booking(p_kind text, p_id uuid, p_new_date date, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_group public.daily_groups;
  v_new_group_id uuid;
  v_seats int := 1;
  v_email text; v_first text; v_pkg public.client_packages;
  v_client_activity activity_type;
  v_label text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_new_date IS NULL OR p_new_date < CURRENT_DATE THEN RAISE EXCEPTION 'invalid_date'; END IF;

  IF p_kind = 'visitor' THEN
    SELECT dg.* INTO v_old_group FROM public.reservations r
      JOIN public.daily_groups dg ON dg.id = r.daily_group_id WHERE r.id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
    SELECT r.participants, r.email, r.first_name, r.client_activity
      INTO v_seats, v_email, v_first, v_client_activity
      FROM public.reservations r WHERE r.id = p_id;
    IF v_client_activity = 'kitesurf' THEN
      v_new_group_id := public.find_or_create_compatible_group(p_new_date, 'kitesurf', GREATEST(v_seats,1));
    ELSE
      v_new_group_id := public.find_or_create_daily_group(p_new_date, v_old_group.activity, GREATEST(v_seats,1));
    END IF;
    UPDATE public.reservations SET daily_group_id = v_new_group_id, updated_at = now() WHERE id = p_id;
    v_label := COALESCE(v_client_activity, v_old_group.activity)::text;
  ELSIF p_kind = 'package' THEN
    SELECT dg.* INTO v_old_group FROM public.package_bookings pb
      JOIN public.daily_groups dg ON dg.id = pb.daily_group_id WHERE pb.id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;
    SELECT cp.* INTO v_pkg FROM public.package_bookings pb
      JOIN public.client_packages cp ON cp.id = pb.package_id WHERE pb.id = p_id;
    v_email := v_pkg.email; v_first := v_pkg.first_name;
    v_new_group_id := public.find_or_create_daily_group(p_new_date, v_old_group.activity, 1);
    UPDATE public.package_bookings SET daily_group_id = v_new_group_id, updated_at = now() WHERE id = p_id;

    INSERT INTO public.package_credit_history
      (package_id, delta, kind, action, reason, booking_id, performed_by, balance_after, activity, daily_group_id)
    VALUES (v_pkg.id, 0, 'report', 'report',
            COALESCE(NULLIF(trim(p_reason),''), 'Report de séance') || ' — ' ||
            to_char(v_old_group.date,'DD/MM/YYYY') || ' → ' || to_char(p_new_date,'DD/MM/YYYY'),
            p_id, auth.uid(), v_pkg.total_sessions - v_pkg.used_sessions,
            v_old_group.activity, v_new_group_id);
    v_label := v_old_group.activity::text;
  ELSE
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  PERFORM public.enqueue_reschedule_notification(p_kind, v_email, v_first,
    v_label, v_old_group.date, p_new_date, p_reason);

  PERFORM public.enqueue_admin_notification(
    'booking_rescheduled', 'info',
    'Réservation reportée — ' || v_label,
    coalesce(v_email,'?') || ' · ' || to_char(v_old_group.date,'DD/MM/YYYY') || ' → ' || to_char(p_new_date,'DD/MM/YYYY'),
    jsonb_build_object('kind', p_kind, 'id', p_id, 'new_date', p_new_date, 'reason', p_reason));

  RETURN jsonb_build_object('ok', true, 'daily_group_id', v_new_group_id);
END;
$function$;