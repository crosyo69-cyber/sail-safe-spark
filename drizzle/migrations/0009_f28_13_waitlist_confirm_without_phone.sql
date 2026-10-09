CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_w public.daily_waitlist; v_group_id uuid; v_res_id uuid; v_ip text; v_subject text;
  v_seats int; v_grp record; v_taken int;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('waitlist_offer_confirm', 'ip:' || v_ip, 10, interval '10 minutes') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  v_subject := public.resolve_link_token('waitlist_offer', p_token);

  SELECT * INTO v_w FROM public.daily_waitlist
   WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
      OR (v_subject IS NULL AND offer_token_hash = public.code_access_hash(p_token::text))
   FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_token'); END IF;
  IF v_w.status = 'converted' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  IF v_w.status <> 'offered' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_active_offer'); END IF;
  IF v_w.offer_expires_at < now() THEN
    UPDATE public.daily_waitlist SET status = 'expired', updated_at = now() WHERE id = v_w.id;
    RETURN jsonb_build_object('ok', false, 'error', 'offer_expired');
  END IF;

  v_seats := GREATEST(v_w.participants, 1);

  IF v_w.offered_group_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || v_w.date::text || ':stage_100_glisse'));
  END IF;
  PERFORM pg_advisory_xact_lock(
    hashtext('public.find_or_create_daily_group:' || v_w.date::text || ':' || v_w.activity::text));

  FOR v_grp IN
    SELECT * FROM public.daily_groups
     WHERE status = 'open'
       AND ((v_w.offered_group_id IS NOT NULL AND id = v_w.offered_group_id)
         OR (date = v_w.date AND activity = v_w.activity))
     ORDER BY (id = v_w.offered_group_id) DESC NULLS LAST, group_index ASC
     FOR UPDATE
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_grp.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_grp.id AND status = 'confirmed'),0)
    INTO v_taken;
    IF (v_taken + v_seats) <= v_grp.max_participants THEN
      v_group_id := v_grp.id; EXIT;
    END IF;
  END LOOP;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_capacity');
  END IF;

  -- F-28-13 : téléphone facultatif ; absent => chaîne vide (reservations.phone est NOT NULL), jamais de numéro fictif.
  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, notes, client_activity
  ) VALUES (
    v_group_id, v_w.first_name, v_w.last_name, v_w.email, COALESCE(v_w.phone, ''),
    'debutant', v_seats, 'confirmed', 'Issu de la liste d''attente', v_w.activity
  ) RETURNING id INTO v_res_id;

  UPDATE public.daily_waitlist SET status = 'converted', updated_at = now() WHERE id = v_w.id;

  RETURN jsonb_build_object('ok', true, 'reservation_id', v_res_id, 'daily_group_id', v_group_id);
END;
$function$;