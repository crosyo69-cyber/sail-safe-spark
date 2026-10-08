CREATE OR REPLACE FUNCTION public.notify_new_reservation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_group public.daily_groups;
  v_label text;
  v_client_activity text;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT * INTO v_group FROM public.daily_groups WHERE id = NEW.daily_group_id;
  -- F-28-07-04 : la notification décrit la réservation du client -> reservations.client_activity
  v_client_activity := COALESCE(NEW.client_activity::text, v_group.activity::text);
  v_label := COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')
           || ' (' || COALESCE(NEW.email,'?') || ')';
  PERFORM public.enqueue_admin_notification(
    'booking_new', 'info',
    'Nouvelle réservation — ' || COALESCE(v_client_activity,'?'),
    v_label || ' · ' || COALESCE(to_char(v_group.date,'DD/MM/YYYY'),'?')
      || ' · ' || COALESCE(NEW.participants::text,'1') || ' pers.'
      || CASE WHEN v_group.activity IS NOT NULL AND v_group.activity::text IS DISTINCT FROM v_client_activity
              THEN ' · Groupe : ' || v_group.activity::text ELSE '' END
      || CASE WHEN NEW.stripe_session_id IS NOT NULL THEN ' · Paiement Stripe OK' ELSE '' END,
    jsonb_build_object(
      'reservation_id', NEW.id, 'daily_group_id', NEW.daily_group_id,
      'email', NEW.email, 'participants', NEW.participants,
      'stripe_session_id', NEW.stripe_session_id,
      'client_activity', v_client_activity,
      'group_activity', v_group.activity),
    'reservation:' || NEW.id::text
  );
  RETURN NEW;
END;
$function$;