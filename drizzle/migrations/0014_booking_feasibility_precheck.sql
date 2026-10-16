-- Pré-contrôle de faisabilité avant paiement (lecture seule, sans création).
-- true si une place peut être honorée : groupe ouvert existant avec capacité
-- suffisante, OU journée sous le plafond de 3 groupes opérationnels.
CREATE OR REPLACE FUNCTION public.booking_feasibility(p_date date, p_activity activity_type, p_seats integer DEFAULT 1)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_groups dg
     WHERE dg.date = p_date AND dg.activity = p_activity AND dg.status = 'open'
       AND dg.max_participants - (
         COALESCE((SELECT SUM(participants) FROM public.reservations
                    WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
       + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                    WHERE daily_group_id = dg.id AND status = 'confirmed'),0)
       ) >= GREATEST(p_seats, 1)
  )
  OR (SELECT count(*) FROM public.daily_groups
       WHERE date = p_date AND status IN ('open','closed')) < 3;
$$;
REVOKE ALL ON FUNCTION public.booking_feasibility(date, activity_type, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.booking_feasibility(date, activity_type, integer) TO service_role;