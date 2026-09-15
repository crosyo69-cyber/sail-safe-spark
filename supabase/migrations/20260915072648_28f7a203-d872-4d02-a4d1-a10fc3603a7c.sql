CREATE OR REPLACE FUNCTION public.find_or_create_daily_group(p_date date, p_activity activity_type, p_seats integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_cap INT := public.default_max_participants(p_activity);
  v_taken INT;
  v_next_index INT;
BEGIN
  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'date_in_past';
  END IF;

  -- F-26-02 : verrou transactionnel déterministe par (date, activité).
  -- Couvre lecture des groupes -> calcul du prochain group_index -> INSERT,
  -- afin d'éviter une collision 23505 entre deux réservations concurrentes.
  -- Portée strictement limitée au couple date/activité (pas de verrou global),
  -- libéré automatiquement à la fin de la transaction.
  PERFORM pg_advisory_xact_lock(
    hashtext('public.find_or_create_daily_group:' || p_date::text || ':' || p_activity::text)
  );

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
$function$;