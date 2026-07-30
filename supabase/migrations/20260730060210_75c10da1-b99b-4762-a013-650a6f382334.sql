-- 1. TABLES -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  activity activity_type NOT NULL,
  origin text NOT NULL DEFAULT 'purchase'
    CHECK (origin IN ('purchase','weather_recredit','commercial','reschedule','admin')),
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','consumed','expired')),
  reason text,
  booking_id uuid REFERENCES public.package_bookings(id) ON DELETE SET NULL,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.session_credits TO authenticated;
GRANT ALL ON public.session_credits TO service_role;
ALTER TABLE public.session_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view credits" ON public.session_credits;
CREATE POLICY "Admins can view credits" ON public.session_credits
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role full access credits" ON public.session_credits;
CREATE POLICY "Service role full access credits" ON public.session_credits
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_session_credits_fifo
  ON public.session_credits(package_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_session_credits_expiry
  ON public.session_credits(status, expires_at);

DROP TRIGGER IF EXISTS trg_session_credits_updated_at ON public.session_credits;
CREATE TRIGGER trg_session_credits_updated_at BEFORE UPDATE ON public.session_credits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.credit_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid,
  package_id uuid,
  action text NOT NULL,
  reason text,
  performed_by uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_audit_log TO authenticated;
GRANT ALL ON public.credit_audit_log TO service_role;
ALTER TABLE public.credit_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view credit audit" ON public.credit_audit_log;
CREATE POLICY "Admins can view credit audit" ON public.credit_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role full access credit audit" ON public.credit_audit_log;
CREATE POLICY "Service role full access credit audit" ON public.credit_audit_log
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_credit_audit_package ON public.credit_audit_log(package_id, created_at DESC);

-- 2. HELPERS ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_credit_action(
  p_credit_id uuid, p_package_id uuid, p_action text,
  p_reason text DEFAULT NULL, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO public.credit_audit_log (credit_id, package_id, action, reason, performed_by, details)
  VALUES (p_credit_id, p_package_id, p_action, p_reason, auth.uid(), COALESCE(p_details,'{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.credit_origin_from_reason(p_kind text, p_reason text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT CASE
    WHEN p_kind = 'initial' THEN 'purchase'
    WHEN lower(coalesce(p_reason,'')) ~ '(vent|météo|meteo|orage)' THEN 'weather_recredit'
    WHEN lower(coalesce(p_reason,'')) ~ '(geste commercial|commercial)' THEN 'commercial'
    WHEN lower(coalesce(p_reason,'')) ~ '(report|reprogramm)' THEN 'reschedule'
    ELSE 'admin'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mint_session_credits(
  p_package_id uuid, p_count integer, p_origin text,
  p_reason text DEFAULT NULL, p_expires_at timestamptz DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_pkg public.client_packages;
  v_exp timestamptz;
  v_id uuid;
  i int;
BEGIN
  IF COALESCE(p_count,0) < 1 THEN RETURN 0; END IF;
  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'package_not_found'; END IF;

  v_exp := COALESCE(p_expires_at, now() + interval '12 months');

  FOR i IN 1..p_count LOOP
    INSERT INTO public.session_credits(package_id, activity, origin, reason, expires_at, performed_by)
    VALUES (p_package_id, v_pkg.activity, p_origin, p_reason, v_exp, auth.uid())
    RETURNING id INTO v_id;
    PERFORM public.log_credit_action(v_id, p_package_id, 'created', p_reason,
      jsonb_build_object('origin', p_origin, 'expires_at', v_exp));
  END LOOP;
  RETURN p_count;
END;
$$;

-- 3. FIFO CONSUMPTION ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_credit_fifo(p_package_id uuid, p_booking_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.session_credits
     SET status = 'expired', updated_at = now()
   WHERE package_id = p_package_id AND status = 'available' AND expires_at < now();

  SELECT id INTO v_id FROM public.session_credits
   WHERE package_id = p_package_id AND status = 'available' AND expires_at >= now()
   ORDER BY expires_at ASC, created_at ASC
   FOR UPDATE SKIP LOCKED
   LIMIT 1;

  IF v_id IS NULL THEN RAISE EXCEPTION 'no_valid_credit'; END IF;

  UPDATE public.session_credits
     SET status = 'consumed', consumed_at = now(), booking_id = p_booking_id, updated_at = now()
   WHERE id = v_id;

  PERFORM public.log_credit_action(v_id, p_package_id, 'consumed', NULL,
    jsonb_build_object('booking_id', p_booking_id));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_credit_fifo(p_package_id uuid, p_booking_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.session_credits
   WHERE package_id = p_package_id AND booking_id = p_booking_id AND status = 'consumed'
   ORDER BY consumed_at DESC LIMIT 1;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.session_credits
     WHERE package_id = p_package_id AND status = 'consumed'
     ORDER BY consumed_at DESC NULLS LAST LIMIT 1;
  END IF;

  IF v_id IS NULL THEN
    PERFORM public.mint_session_credits(p_package_id, 1, 'admin', 'Restitution après annulation');
    RETURN NULL;
  END IF;

  UPDATE public.session_credits
     SET status = CASE WHEN expires_at < now() THEN 'expired' ELSE 'available' END,
         consumed_at = NULL, booking_id = NULL, updated_at = now()
   WHERE id = v_id;

  PERFORM public.log_credit_action(v_id, p_package_id, 'restored', NULL,
    jsonb_build_object('booking_id', p_booking_id));
  RETURN v_id;
END;
$$;

-- 4. TRIGGERS ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_session_credits_on_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.booking_kind = 'regular' THEN
    PERFORM public.consume_credit_fifo(NEW.package_id, NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.booking_kind = 'regular' AND OLD.booking_kind = 'regular' THEN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      PERFORM public.restore_credit_fifo(NEW.package_id, NEW.id);
    ELSIF OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
      PERFORM public.consume_credit_fifo(NEW.package_id, NEW.id);
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' AND OLD.booking_kind = 'regular' THEN
    PERFORM public.restore_credit_fifo(OLD.package_id, OLD.id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_session_credits ON public.package_bookings;
CREATE TRIGGER trg_sync_session_credits
AFTER INSERT OR UPDATE OR DELETE ON public.package_bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_session_credits_on_booking();

CREATE OR REPLACE FUNCTION public.sync_session_credits_on_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; i int;
BEGIN
  IF NEW.kind = 'admin_credit' AND NEW.delta > 0 THEN
    PERFORM public.mint_session_credits(
      NEW.package_id, NEW.delta,
      public.credit_origin_from_reason(NEW.kind, NEW.reason), NEW.reason);
  ELSIF NEW.kind = 'admin_debit' AND NEW.delta < 0 THEN
    FOR i IN 1..(-NEW.delta) LOOP
      SELECT id INTO v_id FROM public.session_credits
       WHERE package_id = NEW.package_id AND status = 'available'
       ORDER BY expires_at ASC, created_at ASC LIMIT 1;
      EXIT WHEN v_id IS NULL;
      UPDATE public.session_credits
         SET status = 'consumed', consumed_at = now(), updated_at = now()
       WHERE id = v_id;
      PERFORM public.log_credit_action(v_id, NEW.package_id, 'admin_debit', NEW.reason, '{}'::jsonb);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_credits_history ON public.package_credit_history;
CREATE TRIGGER trg_sync_credits_history
AFTER INSERT ON public.package_credit_history
FOR EACH ROW EXECUTE FUNCTION public.sync_session_credits_on_history();

CREATE OR REPLACE FUNCTION public.mint_credits_on_package_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.mint_session_credits(NEW.id, NEW.total_sessions, 'purchase', 'Achat du pack',
    COALESCE(NEW.expires_at, now() + interval '12 months'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mint_credits_on_package ON public.client_packages;
CREATE TRIGGER trg_mint_credits_on_package
AFTER INSERT ON public.client_packages
FOR EACH ROW EXECUTE FUNCTION public.mint_credits_on_package_created();

-- 5. BACKFILL -------------------------------------------------------------------
DO $backfill$
DECLARE
  v_pkg record;
  v_recredited int;
  v_purchased int;
  v_id uuid;
  i int;
BEGIN
  FOR v_pkg IN SELECT * FROM public.client_packages LOOP
    IF EXISTS (SELECT 1 FROM public.session_credits WHERE package_id = v_pkg.id) THEN CONTINUE; END IF;

    SELECT COALESCE(SUM(delta),0)::int INTO v_recredited
      FROM public.package_credit_history
     WHERE package_id = v_pkg.id AND kind = 'admin_credit';
    v_recredited := LEAST(GREATEST(v_recredited,0), v_pkg.total_sessions);
    v_purchased := GREATEST(v_pkg.total_sessions - v_recredited, 0);

    IF v_purchased > 0 THEN
      INSERT INTO public.session_credits(package_id, activity, origin, reason, expires_at, created_at)
      SELECT v_pkg.id, v_pkg.activity, 'purchase', 'Achat du pack (reprise)',
             COALESCE(v_pkg.expires_at, v_pkg.created_at + interval '12 months'), v_pkg.created_at
      FROM generate_series(1, v_purchased);
    END IF;
    IF v_recredited > 0 THEN
      INSERT INTO public.session_credits(package_id, activity, origin, reason, expires_at, created_at)
      SELECT v_pkg.id, v_pkg.activity, 'admin', 'Recrédit (reprise)',
             COALESCE(v_pkg.expires_at, v_pkg.created_at + interval '12 months'), v_pkg.created_at
      FROM generate_series(1, v_recredited);
    END IF;

    FOR i IN 1..GREATEST(v_pkg.used_sessions,0) LOOP
      SELECT id INTO v_id FROM public.session_credits
       WHERE package_id = v_pkg.id AND status = 'available'
       ORDER BY expires_at ASC, created_at ASC LIMIT 1;
      EXIT WHEN v_id IS NULL;
      UPDATE public.session_credits
         SET status = 'consumed', consumed_at = v_pkg.updated_at, updated_at = now()
       WHERE id = v_id;
    END LOOP;
  END LOOP;
END;
$backfill$;

-- 6. EXPIRATION JOB ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_session_credits()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_n int;
BEGIN
  WITH upd AS (
    UPDATE public.session_credits
       SET status = 'expired', updated_at = now()
     WHERE status = 'available' AND expires_at < now()
     RETURNING id, package_id
  )
  INSERT INTO public.credit_audit_log (credit_id, package_id, action, reason, details)
  SELECT id, package_id, 'expired', 'Expiration automatique', '{}'::jsonb FROM upd;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('expired', v_n);
END;
$$;

-- 7. ADMIN OPERATIONS --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_extend_credit(p_credit_id uuid, p_new_expires_at timestamptz, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.session_credits;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;
  SELECT * INTO v FROM public.session_credits WHERE id = p_credit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'credit_not_found'; END IF;
  IF p_new_expires_at <= now() THEN RAISE EXCEPTION 'invalid_date'; END IF;

  UPDATE public.session_credits
     SET expires_at = p_new_expires_at,
         status = CASE WHEN status = 'expired' THEN 'available' ELSE status END,
         updated_at = now()
   WHERE id = p_credit_id;

  PERFORM public.log_credit_action(p_credit_id, v.package_id, 'extended', trim(p_reason),
    jsonb_build_object('from', v.expires_at, 'to', p_new_expires_at));
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_credit(p_credit_id uuid, p_new_expires_at timestamptz, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v public.session_credits;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;
  SELECT * INTO v FROM public.session_credits WHERE id = p_credit_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'credit_not_found'; END IF;
  IF v.status <> 'expired' THEN RAISE EXCEPTION 'credit_not_expired'; END IF;

  UPDATE public.session_credits
     SET status = 'available',
         expires_at = COALESCE(p_new_expires_at, now() + interval '6 months'),
         updated_at = now()
   WHERE id = p_credit_id;

  PERFORM public.log_credit_action(p_credit_id, v.package_id, 'reactivated', trim(p_reason),
    jsonb_build_object('expires_at', COALESCE(p_new_expires_at, now() + interval '6 months')));
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_credits(p_package_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'activity', c.activity, 'origin', c.origin,
    'status', CASE WHEN c.status = 'available' AND c.expires_at < now() THEN 'expired' ELSE c.status END,
    'reason', c.reason, 'created_at', c.created_at, 'expires_at', c.expires_at,
    'consumed_at', c.consumed_at, 'booking_id', c.booking_id
  ) ORDER BY c.expires_at ASC), '[]'::jsonb) INTO v
  FROM public.session_credits c WHERE c.package_id = p_package_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_credit_audit(p_package_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC), '[]'::jsonb) INTO v
  FROM public.credit_audit_log a WHERE a.package_id = p_package_id;
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credits_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pkg_ids uuid[]; v jsonb;
BEGIN
  SELECT array_agg(id) INTO v_pkg_ids FROM public.client_packages WHERE package_code = p_code;
  IF v_pkg_ids IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'activity', c.activity, 'origin', c.origin,
    'status', CASE WHEN c.status = 'available' AND c.expires_at < now() THEN 'expired' ELSE c.status END,
    'created_at', c.created_at, 'expires_at', c.expires_at, 'consumed_at', c.consumed_at
  ) ORDER BY c.expires_at ASC), '[]'::jsonb) INTO v
  FROM public.session_credits c WHERE c.package_id = ANY(v_pkg_ids);
  RETURN v;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mint_session_credits(uuid,integer,text,text,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_credit_fifo(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_credit_fifo(uuid,uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_credit_action(uuid,uuid,text,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_session_credits() FROM PUBLIC, anon, authenticated;