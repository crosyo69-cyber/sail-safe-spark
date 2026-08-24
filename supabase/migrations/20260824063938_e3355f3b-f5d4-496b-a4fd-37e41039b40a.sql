CREATE OR REPLACE FUNCTION public.get_daily_availability(p_date date)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'places_restantes', CASE
        WHEN (SELECT COUNT(*) FROM grp WHERE activity='kitesurf') = 0
          THEN public.default_max_participants('kitesurf'::activity_type)
        ELSE COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='kitesurf'),0)
      END,
      'capacite_potentielle', public.default_max_participants('kitesurf'::activity_type)
    ),
    'wingfoil', jsonb_build_object(
      'inscrits', COALESCE((SELECT SUM(taken) FROM grp WHERE activity='wingfoil'),0),
      'groupes', COALESCE((SELECT COUNT(*) FROM grp WHERE activity='wingfoil'),0),
      'places_restantes', CASE
        WHEN (SELECT COUNT(*) FROM grp WHERE activity='wingfoil') = 0
          THEN public.default_max_participants('wingfoil'::activity_type)
        ELSE COALESCE((SELECT SUM(max_participants - taken) FROM grp WHERE activity='wingfoil'),0)
      END,
      'capacite_potentielle', public.default_max_participants('wingfoil'::activity_type)
    )
  )
$function$;