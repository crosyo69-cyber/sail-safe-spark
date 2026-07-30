CREATE OR REPLACE FUNCTION public.on_spot_freed_notify_waitlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_dg public.daily_groups;
BEGIN
  IF NEW.daily_group_id IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_dg FROM public.daily_groups WHERE id = NEW.daily_group_id;
  IF NOT FOUND OR v_dg.status <> 'open' OR v_dg.date < CURRENT_DATE THEN RETURN NEW; END IF;

  BEGIN
    PERFORM public.offer_waitlist_spot(v_dg.date, v_dg.activity);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'waitlist offer failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_waitlist_on_booking_cancel ON public.package_bookings;
CREATE TRIGGER trg_waitlist_on_booking_cancel
AFTER UPDATE OF status ON public.package_bookings
FOR EACH ROW
WHEN (OLD.status = 'confirmed' AND NEW.status = 'cancelled')
EXECUTE FUNCTION public.on_spot_freed_notify_waitlist();

DROP TRIGGER IF EXISTS trg_waitlist_on_reservation_cancel ON public.reservations;
CREATE TRIGGER trg_waitlist_on_reservation_cancel
AFTER UPDATE OF status ON public.reservations
FOR EACH ROW
WHEN (OLD.status <> 'cancelled' AND NEW.status = 'cancelled')
EXECUTE FUNCTION public.on_spot_freed_notify_waitlist();