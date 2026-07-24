
DROP TRIGGER IF EXISTS trg_enforce_capacity_package_bookings ON public.package_bookings;
CREATE TRIGGER trg_enforce_capacity_package_bookings
  BEFORE INSERT OR UPDATE OF status, session_id ON public.package_bookings
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.enforce_session_capacity();

DROP TRIGGER IF EXISTS trg_enforce_capacity_reservations ON public.reservations;
CREATE TRIGGER trg_enforce_capacity_reservations
  BEFORE INSERT OR UPDATE OF status, participants, session_id ON public.reservations
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.enforce_session_capacity();

-- Auto-close trigger: gate on NEW.session_id only (UPDATE-only OLD ref isn't allowed on INSERT).
-- Old-model rows always keep session_id set, so this preserves historical behavior.
DROP TRIGGER IF EXISTS trg_autoclose_pkg ON public.package_bookings;
CREATE TRIGGER trg_autoclose_pkg
  AFTER INSERT OR UPDATE ON public.package_bookings
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.auto_close_full_session();

DROP TRIGGER IF EXISTS trg_autoclose_res ON public.reservations;
CREATE TRIGGER trg_autoclose_res
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION public.auto_close_full_session();

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg_id uuid;
  v_date date;
BEGIN
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT COALESCE(dg.date, s.date) INTO v_date
    FROM public.package_bookings b
    LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
    LEFT JOIN public.sessions s ON s.id = b.session_id
   WHERE b.id = p_booking_id AND b.package_id = v_pkg_id;
  IF NOT FOUND OR v_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_date <= (CURRENT_DATE + interval '2 days')::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late_to_cancel');
  END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id AND status = 'confirmed';

  RETURN jsonb_build_object('ok', true);
END;
$$;
