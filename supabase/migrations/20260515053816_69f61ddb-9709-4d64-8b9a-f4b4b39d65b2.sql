-- ============================================================
-- 1. Tables
-- ============================================================

CREATE TABLE public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_code text NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  activity activity_type NOT NULL,
  package_type text NOT NULL,
  total_sessions integer NOT NULL CHECK (total_sessions > 0),
  used_sessions integer NOT NULL DEFAULT 0 CHECK (used_sessions >= 0),
  deposit_amount numeric(10,2),
  deposit_paid_at timestamptz,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 months'),
  notes_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_packages_code ON public.client_packages(package_code);
CREATE INDEX idx_client_packages_email ON public.client_packages(email);
CREATE INDEX idx_client_packages_status ON public.client_packages(status);

CREATE TABLE public.package_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, session_id)
);

CREATE INDEX idx_package_bookings_package ON public.package_bookings(package_id);
CREATE INDEX idx_package_bookings_session ON public.package_bookings(session_id);

-- updated_at triggers
CREATE TRIGGER trg_client_packages_updated_at
  BEFORE UPDATE ON public.client_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_package_bookings_updated_at
  BEFORE UPDATE ON public.package_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Trigger: maintain used_sessions counter
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_package_used_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE public.client_packages
       SET used_sessions = used_sessions + 1
     WHERE id = NEW.package_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
      UPDATE public.client_packages
         SET used_sessions = GREATEST(used_sessions - 1, 0)
       WHERE id = NEW.package_id;
    ELSIF OLD.status = 'cancelled' AND NEW.status = 'confirmed' THEN
      UPDATE public.client_packages
         SET used_sessions = used_sessions + 1
       WHERE id = NEW.package_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE public.client_packages
       SET used_sessions = GREATEST(used_sessions - 1, 0)
     WHERE id = OLD.package_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_used_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.package_bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_package_used_sessions();

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_bookings ENABLE ROW LEVEL SECURITY;

-- client_packages: only admins read directly; service role full
CREATE POLICY "Admins read client_packages"
  ON public.client_packages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update client_packages"
  ON public.client_packages FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete client_packages"
  ON public.client_packages FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages packages"
  ON public.client_packages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- package_bookings: admins + service role
CREATE POLICY "Admins read package_bookings"
  ON public.package_bookings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update package_bookings"
  ON public.package_bookings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete package_bookings"
  ON public.package_bookings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages bookings"
  ON public.package_bookings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- 4. RPC functions (SECURITY DEFINER) — used by client with code
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_bookings jsonb;
BEGIN
  SELECT * INTO v_pkg
    FROM public.client_packages
   WHERE package_code = p_code
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'session_id', b.session_id,
    'status', b.status,
    'date', s.date,
    'time_slot', s.time_slot,
    'activity', s.activity,
    'created_at', b.created_at
  ) ORDER BY s.date), '[]'::jsonb)
  INTO v_bookings
  FROM public.package_bookings b
  JOIN public.sessions s ON s.id = b.session_id
  WHERE b.package_id = v_pkg.id;

  RETURN jsonb_build_object(
    'id', v_pkg.id,
    'package_code', v_pkg.package_code,
    'first_name', v_pkg.first_name,
    'last_name', v_pkg.last_name,
    'email', v_pkg.email,
    'activity', v_pkg.activity,
    'package_type', v_pkg.package_type,
    'total_sessions', v_pkg.total_sessions,
    'used_sessions', v_pkg.used_sessions,
    'remaining_sessions', v_pkg.total_sessions - v_pkg.used_sessions,
    'status', v_pkg.status,
    'expires_at', v_pkg.expires_at,
    'deposit_amount', v_pkg.deposit_amount,
    'bookings', v_bookings
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.book_session_with_code(p_code text, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_session public.sessions;
  v_current_count integer;
  v_booking_id uuid;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_pkg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'package_not_active');
  END IF;
  IF v_pkg.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'package_expired');
  END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_credits_left');
  END IF;

  SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;
  IF v_session.activity <> v_pkg.activity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'activity_mismatch');
  END IF;
  IF v_session.status <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_closed');
  END IF;
  IF v_session.date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_in_past');
  END IF;

  -- check capacity (existing reservations + package_bookings confirmed)
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
               WHERE session_id = p_session_id AND status <> 'cancelled'), 0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE session_id = p_session_id AND status = 'confirmed'), 0)
  INTO v_current_count;

  IF v_current_count >= v_session.max_participants THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_full');
  END IF;

  INSERT INTO public.package_bookings (package_id, session_id, status)
    VALUES (v_pkg.id, p_session_id, 'confirmed')
  ON CONFLICT (package_id, session_id) DO UPDATE
    SET status = 'confirmed', updated_at = now()
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg_id uuid;
  v_session_date date;
BEGIN
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT s.date INTO v_session_date
    FROM public.package_bookings b
    JOIN public.sessions s ON s.id = b.session_id
   WHERE b.id = p_booking_id AND b.package_id = v_pkg_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_session_date <= (CURRENT_DATE + interval '2 days')::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late_to_cancel');
  END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id AND status = 'confirmed';

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Allow anon + authenticated to call the RPCs (code acts as token)
GRANT EXECUTE ON FUNCTION public.get_package_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_session_with_code(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_code(text, uuid) TO anon, authenticated;