-- F-28-03_compatible_group_selection
CREATE OR REPLACE FUNCTION public.find_or_create_compatible_group(p_date date, p_client_activity activity_type, p_seats integer DEFAULT 1)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_taken INT;
  v_seats INT := GREATEST(p_seats, 1);
BEGIN
  IF p_client_activity <> 'kitesurf' THEN
    RAISE EXCEPTION 'compatible_group_unsupported_activity: %', p_client_activity;
  END IF;
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'date_in_past';
  END IF;

  -- Ordre des verrous (documenté) : 1) Stage, 2) Kitesurf, mêmes clés que
  -- find_or_create_daily_group / book_stage_for_participants. Le flux Stage ne
  -- prend jamais la clé Kitesurf : aucun ordre inverse possible.
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':stage_100_glisse'));
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':kitesurf'));

  -- Priorité 1 : groupe Kitesurf ouvert ; Priorité 2 : groupe Stage compatible.
  FOR v_group IN
    SELECT g.* FROM public.daily_groups g
     JOIN public.activity_group_compatibility c
       ON c.group_activity = g.activity AND c.allowed_client_activity = p_client_activity
     WHERE g.date = p_date AND g.status = 'open'
       AND g.activity IN ('kitesurf','stage_100_glisse')
     ORDER BY CASE WHEN g.activity = 'kitesurf' THEN 1 ELSE 2 END, g.group_index ASC
     FOR UPDATE OF g
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_group.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_group.id AND status = 'confirmed'),0)
    INTO v_taken;
    IF (v_taken + v_seats) <= v_group.max_participants THEN
      RETURN v_group.id;
    END IF;
  END LOOP;

  -- Priorité 3 : création d'un groupe Kitesurf normal (jamais Stage), via le moteur historique.
  RETURN public.find_or_create_daily_group(p_date, 'kitesurf', v_seats);
END;
$function$;
REVOKE ALL ON FUNCTION public.find_or_create_compatible_group(date, activity_type, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_compatible_group(date, activity_type, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.book_daily_visitor(p_date date, p_activity activity_type, p_first_name text, p_last_name text, p_email text, p_phone text, p_participants integer, p_stripe_session_id text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- F-28-03 : seule la branche kitesurf utilise la sélection compatible.
  IF p_activity = 'kitesurf' THEN
    v_group_id := public.find_or_create_compatible_group(p_date, p_activity, GREATEST(p_participants,1));
  ELSE
    v_group_id := public.find_or_create_daily_group(p_date, p_activity, GREATEST(p_participants,1));
  END IF;

  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, stripe_session_id, notes, client_activity
  ) VALUES (
    v_group_id, p_first_name, p_last_name, p_email, p_phone,
    'debutant', GREATEST(p_participants,1), 'confirmed', p_stripe_session_id, p_notes,
    CASE WHEN p_activity = 'kitesurf' THEN 'kitesurf'::activity_type ELSE NULL END
  ) RETURNING id INTO v_res_id;

  RETURN jsonb_build_object('ok',true,'reservation_id',v_res_id,'daily_group_id',v_group_id);
END;
$function$;