-- F-28-09 : une offre ciblée en cours (place Kite dans un groupe Stage) réserve ses places :
-- elles ne sont plus comptées libres pour la liste de l'activité du groupe.
CREATE OR REPLACE FUNCTION public.waitlist_free_seats(p_date date, p_activity activity_type, p_include_potential boolean DEFAULT false)
 RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_groups int; v_free int; v_held int;
BEGIN
  SELECT COUNT(*),
         COALESCE(SUM(dg.max_participants - (
            COALESCE((SELECT SUM(participants) FROM public.reservations
                       WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
          + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                       WHERE daily_group_id = dg.id AND status = 'confirmed'),0))), 0)
    INTO v_groups, v_free
    FROM public.daily_groups dg
   WHERE dg.date = p_date AND dg.activity = p_activity AND dg.status = 'open';

  IF p_include_potential AND v_groups = 0 THEN
    RETURN public.default_max_participants(p_activity);
  END IF;

  SELECT COALESCE(SUM(GREATEST(w.participants,1)),0) INTO v_held
    FROM public.daily_waitlist w JOIN public.daily_groups g ON g.id = w.offered_group_id
   WHERE w.status = 'offered' AND w.offer_expires_at >= now()
     AND g.date = p_date AND g.activity = p_activity AND g.status = 'open';

  RETURN GREATEST(COALESCE(v_free, 0) - v_held, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_waitlist_for_group(p_group_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_dg public.daily_groups; v_r jsonb;
BEGIN
  SELECT * INTO v_dg FROM public.daily_groups WHERE id = p_group_id;
  IF NOT FOUND OR v_dg.status <> 'open' OR v_dg.date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  IF v_dg.activity = 'stage_100_glisse'
     AND EXISTS (SELECT 1 FROM public.package_bookings WHERE daily_group_id = v_dg.id AND status = 'confirmed') THEN
    v_r := public.offer_waitlist_spot_in(v_dg.date, 'kitesurf', v_dg.id);
    -- Offre faite OU offre Kitesurf déjà en cours : pas de repli Stage sur la même place.
    IF v_r ? 'offered_to' OR v_r ? 'offer_pending' THEN RETURN v_r; END IF;
  END IF;

  RETURN public.offer_waitlist_spot_in(v_dg.date, v_dg.activity, NULL);
END;
$function$;