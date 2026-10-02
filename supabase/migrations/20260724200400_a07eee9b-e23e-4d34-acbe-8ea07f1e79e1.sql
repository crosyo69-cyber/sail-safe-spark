-- 1) Clean up: close all past OPEN sessions (legacy duplicates from pre-generation).
UPDATE public.sessions
   SET status = 'closed', updated_at = now()
 WHERE status = 'open' AND date < CURRENT_DATE;

-- 2) Enforce "1 activity per slot" for OPEN kite/wing sessions going forward.
CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_activity_per_open_slot
  ON public.sessions (date, time_slot)
  WHERE status = 'open' AND activity IN ('kitesurf', 'wingfoil');

-- 3) Defensive check in book_session_with_code (mirrors the DB constraint).
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
  v_conflict_activity text;
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

  -- Rule "1 boat, 1 activity per slot"
  IF v_session.activity IN ('kitesurf','wingfoil') THEN
    SELECT activity::text INTO v_conflict_activity
      FROM public.sessions
     WHERE date = v_session.date
       AND time_slot = v_session.time_slot
       AND status = 'open'
       AND activity IN ('kitesurf','wingfoil')
       AND id <> v_session.id
     LIMIT 1;
    IF v_conflict_activity IS NOT NULL THEN
      RETURN jsonb_build_object('ok',false,'error','slot_taken_by_other_activity','other_activity',v_conflict_activity);
    END IF;
  END IF;

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