-- A1 : un pack Stage créé par le paiement en ligne (participant_index renseigné, S1/S2/A0)
-- reçoit déjà une confirmation globale envoyée par le webhook ; pas de confirmation par jour.
CREATE OR REPLACE FUNCTION public.on_package_booking_created_dg()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.daily_group_id IS NOT NULL AND NEW.status = 'confirmed' AND NEW.booking_kind = 'regular' THEN
    IF NEW.stage_group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.client_packages cp
      WHERE cp.id = NEW.package_id
        AND cp.activity = 'stage_100_glisse'
        AND cp.participant_index IS NOT NULL
    ) THEN
      RETURN NEW; -- A1 : confirmation globale unique envoyée par le flux Stage (A0)
    END IF;
    PERFORM public.enqueue_booking_confirmation(NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- A1 : pas d'avertissement « crédits faibles » quand la consommation provient
-- de la planification d'un Stage 100 % Glisse (5 jours réservés d'un bloc).
CREATE OR REPLACE FUNCTION public.sync_package_used_sessions()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_delta int := 0;
  v_kind text;
  v_booking_id uuid;
  v_is_weather boolean;
  v_stage_planning boolean := false;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_kind = 'regular' THEN
    v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
    v_stage_planning := NEW.stage_group_id IS NOT NULL;
    UPDATE public.client_packages SET used_sessions = used_sessions + 1
      WHERE id = NEW.package_id RETURNING * INTO v_pkg;
  ELSIF TG_OP = 'UPDATE' THEN
    v_is_weather := NEW.booking_kind = 'weather_credit' OR OLD.booking_kind = 'weather_credit';
    IF NOT v_is_weather THEN
      IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        v_delta := 1; v_kind := 'cancellation'; v_booking_id := NEW.id;
        UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
          WHERE id = NEW.package_id RETURNING * INTO v_pkg;
      ELSIF OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
        v_delta := -1; v_kind := 'booking'; v_booking_id := NEW.id;
        v_stage_planning := NEW.stage_group_id IS NOT NULL;
        UPDATE public.client_packages SET used_sessions = used_sessions + 1
          WHERE id = NEW.package_id RETURNING * INTO v_pkg;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' AND OLD.booking_kind = 'regular' THEN
    v_delta := 1; v_kind := 'cancellation'; v_booking_id := OLD.id;
    UPDATE public.client_packages SET used_sessions = GREATEST(used_sessions - 1, 0)
      WHERE id = OLD.package_id RETURNING * INTO v_pkg;
  END IF;

  IF v_delta <> 0 AND v_pkg.id IS NOT NULL THEN
    INSERT INTO public.package_credit_history
      (package_id, delta, kind, reason, booking_id, balance_after)
    VALUES
      (v_pkg.id, v_delta, v_kind,
       CASE v_kind WHEN 'booking' THEN 'Inscription à une session'
                   WHEN 'cancellation' THEN 'Annulation d''une session' END,
       v_booking_id,
       v_pkg.total_sessions - v_pkg.used_sessions);

    IF v_delta < 0 AND (v_pkg.total_sessions - v_pkg.used_sessions) = 1
       AND NOT (v_stage_planning AND v_pkg.activity = 'stage_100_glisse') THEN
      PERFORM public.enqueue_low_credit_warning(v_pkg.id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;