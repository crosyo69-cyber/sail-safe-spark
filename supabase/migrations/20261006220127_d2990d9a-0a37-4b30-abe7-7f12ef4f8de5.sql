-- F-28-03-HARDENING : un groupe Stage sans participant Stage confirmé n'accueille pas de Kitesurf.
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

  -- Ordre des verrous : 1) Stage, 2) Kitesurf (mêmes clés que les fonctions existantes).
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':stage_100_glisse'));
  PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || p_date::text || ':kitesurf'));

  -- Priorité 1 : groupe Kitesurf ouvert.
  -- Priorité 2 : groupe Stage compatible contenant au moins 1 participant Stage confirmé.
  FOR v_group IN
    SELECT g.* FROM public.daily_groups g
     JOIN public.activity_group_compatibility c
       ON c.group_activity = g.activity AND c.allowed_client_activity = p_client_activity
     WHERE g.date = p_date AND g.status = 'open'
       AND (
         g.activity = 'kitesurf'
         OR (g.activity = 'stage_100_glisse' AND EXISTS (
               SELECT 1 FROM public.package_bookings pb
                WHERE pb.daily_group_id = g.id AND pb.status = 'confirmed'))
       )
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

  -- Priorité 3 : nouveau groupe Kitesurf (jamais Stage).
  RETURN public.find_or_create_daily_group(p_date, 'kitesurf', v_seats);
END;
$function$;
REVOKE ALL ON FUNCTION public.find_or_create_compatible_group(date, activity_type, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_compatible_group(date, activity_type, integer) TO service_role;