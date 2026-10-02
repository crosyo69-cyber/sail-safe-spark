
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ref_key text,
  read_at timestamptz,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notifications_created_idx ON public.admin_notifications (created_at DESC);
CREATE INDEX admin_notifications_unread_idx ON public.admin_notifications (read_at) WHERE read_at IS NULL;
CREATE INDEX admin_notifications_email_pending_idx ON public.admin_notifications (email_sent_at, severity) WHERE email_sent_at IS NULL;
CREATE INDEX admin_notifications_ref_idx ON public.admin_notifications (kind, ref_key, created_at DESC) WHERE ref_key IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role full access" ON public.admin_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
ALTER TABLE public.admin_notifications REPLICA IDENTITY FULL;

-- Fonction d'enqueue avec dedup applicatif (1h)
CREATE OR REPLACE FUNCTION public.enqueue_admin_notification(
  p_kind text,
  p_severity text,
  p_title text,
  p_body text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_ref_key text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_exists uuid;
BEGIN
  IF p_ref_key IS NOT NULL THEN
    SELECT id INTO v_exists FROM public.admin_notifications
     WHERE kind = p_kind AND ref_key = p_ref_key
       AND created_at > now() - interval '1 hour'
     LIMIT 1;
    IF v_exists IS NOT NULL THEN
      RETURN v_exists;
    END IF;
  END IF;
  INSERT INTO public.admin_notifications (kind, severity, title, body, metadata, ref_key)
  VALUES (p_kind, COALESCE(p_severity,'info'), p_title, p_body,
          COALESCE(p_metadata,'{}'::jsonb), p_ref_key)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_admin_notification(text,text,text,text,jsonb,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.enqueue_admin_notification(text,text,text,text,jsonb,text) TO authenticated, service_role;

-- Trigger nouvelle réservation
CREATE OR REPLACE FUNCTION public.notify_new_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_session public.sessions;
  v_label text;
BEGIN
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT * INTO v_session FROM public.sessions WHERE id = NEW.session_id;
  v_label := COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')
           || ' (' || COALESCE(NEW.email,'?') || ')';
  PERFORM public.enqueue_admin_notification(
    'booking_new', 'info',
    'Nouvelle réservation — ' || COALESCE(v_session.activity::text,'?'),
    v_label || ' · ' || COALESCE(to_char(v_session.date,'DD/MM/YYYY'),'?')
      || ' · ' || COALESCE(NEW.participants::text,'1') || ' pers.'
      || CASE WHEN NEW.stripe_session_id IS NOT NULL THEN ' · Paiement Stripe OK' ELSE '' END,
    jsonb_build_object(
      'reservation_id', NEW.id, 'session_id', NEW.session_id,
      'email', NEW.email, 'participants', NEW.participants,
      'stripe_session_id', NEW.stripe_session_id),
    'reservation:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_new_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_reservation();

CREATE OR REPLACE FUNCTION public.notify_session_closed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'closed' AND COALESCE(OLD.status,'') <> 'closed' THEN
    PERFORM public.enqueue_admin_notification(
      'session_full', 'info',
      'Session complète — ' || NEW.activity::text,
      to_char(NEW.date,'DD/MM/YYYY') || ' · ' || NEW.time_slot::text || ' · capacité atteinte',
      jsonb_build_object('session_id', NEW.id, 'date', NEW.date, 'time_slot', NEW.time_slot),
      'session_full:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_session_closed
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_closed();

CREATE OR REPLACE FUNCTION public.notify_session_reopened()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'open'
     AND OLD.status IN ('closed','cancelled')
     AND NEW.date >= CURRENT_DATE THEN
    PERFORM public.enqueue_admin_notification(
      'last_minute_freed', 'info',
      'Place libérée — ' || NEW.activity::text,
      to_char(NEW.date,'DD/MM/YYYY') || ' · ' || NEW.time_slot::text || ' · réouverte aux inscriptions',
      jsonb_build_object('session_id', NEW.id, 'date', NEW.date, 'time_slot', NEW.time_slot),
      'reopen:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_session_reopened
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_session_reopened();

-- Hook recrédit manuel
CREATE OR REPLACE FUNCTION public.admin_adjust_package_credits(p_package_id uuid, p_delta integer, p_reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_pkg public.client_packages;
  v_kind text;
  v_caller uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_delta = 0 THEN RAISE EXCEPTION 'delta_zero'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'package_not_found'; END IF;

  IF p_delta > 0 THEN
    v_kind := 'admin_credit';
    UPDATE public.client_packages
       SET total_sessions = total_sessions + p_delta,
           status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
           updated_at = now()
     WHERE id = p_package_id RETURNING * INTO v_pkg;
  ELSE
    v_kind := 'admin_debit';
    IF v_pkg.total_sessions - v_pkg.used_sessions + p_delta < 0 THEN
      RAISE EXCEPTION 'insufficient_credits';
    END IF;
    UPDATE public.client_packages
       SET used_sessions = used_sessions + (-p_delta), updated_at = now()
     WHERE id = p_package_id RETURNING * INTO v_pkg;
  END IF;

  INSERT INTO public.package_credit_history
    (package_id, delta, kind, reason, performed_by, balance_after)
  VALUES
    (p_package_id, p_delta, v_kind, trim(p_reason), v_caller,
     v_pkg.total_sessions - v_pkg.used_sessions);

  IF p_delta < 0 AND (v_pkg.total_sessions - v_pkg.used_sessions) = 1 THEN
    PERFORM public.enqueue_low_credit_warning(v_pkg.id);
  END IF;

  PERFORM public.enqueue_admin_notification(
    'admin_credit', 'info',
    CASE WHEN p_delta > 0 THEN 'Recrédit manuel' ELSE 'Débit manuel' END
      || ' — ' || COALESCE(v_pkg.first_name,'') || ' ' || COALESCE(v_pkg.last_name,''),
    'Pack ' || v_pkg.package_code || ' · ' ||
      CASE WHEN p_delta > 0 THEN '+' ELSE '' END || p_delta::text || ' session(s) · ' ||
      'Solde : ' || (v_pkg.total_sessions - v_pkg.used_sessions)::text || '/' || v_pkg.total_sessions::text ||
      ' · Motif : ' || trim(p_reason),
    jsonb_build_object('package_id', p_package_id, 'package_code', v_pkg.package_code,
                       'delta', p_delta, 'reason', trim(p_reason), 'performed_by', v_caller)
  );

  RETURN jsonb_build_object('ok', true,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions,
    'total', v_pkg.total_sessions, 'used', v_pkg.used_sessions);
END;
$function$;
