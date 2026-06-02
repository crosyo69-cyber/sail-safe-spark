-- Last Minute system: extend sessions, add subscribers table, auto-close trigger

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS is_last_minute boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_minute_label text,
  ADD COLUMN IF NOT EXISTS weather_note text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Validation: label must be null or 'fire' / 'wind'
CREATE OR REPLACE FUNCTION public.validate_last_minute_label()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.last_minute_label IS NOT NULL
     AND NEW.last_minute_label NOT IN ('fire','wind') THEN
    RAISE EXCEPTION 'Invalid last_minute_label: %', NEW.last_minute_label;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_last_minute_label ON public.sessions;
CREATE TRIGGER trg_validate_last_minute_label
BEFORE INSERT OR UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.validate_last_minute_label();

-- Auto-close a session when capacity is reached
CREATE OR REPLACE FUNCTION public.auto_close_full_session()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_session public.sessions;
  v_count int;
BEGIN
  SELECT * INTO v_session FROM public.sessions
   WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  IF NOT FOUND OR v_session.status <> 'open' THEN
    RETURN NEW;
  END IF;
  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
               WHERE session_id = v_session.id AND status <> 'cancelled'), 0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE session_id = v_session.id AND status = 'confirmed'), 0)
  INTO v_count;
  IF v_count >= v_session.max_participants THEN
    UPDATE public.sessions SET status = 'closed', updated_at = now()
     WHERE id = v_session.id AND status = 'open';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_autoclose_res ON public.reservations;
CREATE TRIGGER trg_autoclose_res
AFTER INSERT OR UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.auto_close_full_session();

DROP TRIGGER IF EXISTS trg_autoclose_pkg ON public.package_bookings;
CREATE TRIGGER trg_autoclose_pkg
AFTER INSERT OR UPDATE ON public.package_bookings
FOR EACH ROW EXECUTE FUNCTION public.auto_close_full_session();

-- Realtime
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.package_bookings REPLICA IDENTITY FULL;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='sessions';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions; END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='reservations';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations; END IF;
END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='package_bookings';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.package_bookings; END IF;
END $$;

-- Subscribers table (double opt-in)
CREATE TABLE IF NOT EXISTS public.last_minute_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  activities text[] NOT NULL DEFAULT ARRAY['kitesurf','wingfoil','kitefoil']::text[],
  confirmed boolean NOT NULL DEFAULT false,
  confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT INSERT ON public.last_minute_subscribers TO anon, authenticated;
GRANT ALL ON public.last_minute_subscribers TO service_role;

ALTER TABLE public.last_minute_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.last_minute_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read subscribers"
  ON public.last_minute_subscribers
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages subscribers"
  ON public.last_minute_subscribers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Confirm subscription (public RPC)
CREATE OR REPLACE FUNCTION public.confirm_last_minute_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_n int;
BEGIN
  UPDATE public.last_minute_subscribers
     SET confirmed = true, confirmed_at = now(), updated_at = now()
   WHERE confirm_token = p_token AND confirmed = false;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

-- Unsubscribe (public RPC)
CREATE OR REPLACE FUNCTION public.unsubscribe_last_minute(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_n int;
BEGIN
  DELETE FROM public.last_minute_subscribers WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_last_minute_subscription(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_last_minute(uuid) TO anon, authenticated;