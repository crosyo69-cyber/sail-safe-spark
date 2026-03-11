
-- Enums
CREATE TYPE public.activity_type AS ENUM ('kitesurf', 'wingfoil', 'pumpfoil', 'foil_tracte');
CREATE TYPE public.time_slot AS ENUM ('morning', 'early_afternoon', 'late_afternoon');
CREATE TYPE public.skill_level AS ENUM ('debutant', 'intermediaire', 'confirme');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot public.time_slot NOT NULL,
  activity public.activity_type NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  weather_condition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, time_slot, activity)
);

-- Reservations table
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  skill_level public.skill_level NOT NULL DEFAULT 'debutant',
  participants INTEGER NOT NULL DEFAULT 1,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Sessions RLS
CREATE POLICY "Anyone can view sessions" ON public.sessions
FOR SELECT USING (true);

CREATE POLICY "Admins can insert sessions" ON public.sessions
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sessions" ON public.sessions
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sessions" ON public.sessions
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Reservations RLS
CREATE POLICY "Admins can view all reservations" ON public.reservations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own reservations" ON public.reservations
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create reservations" ON public.reservations
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update reservations" ON public.reservations
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reservations" ON public.reservations
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for session status
CREATE OR REPLACE FUNCTION public.validate_session_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('open', 'closed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid session status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_session_status_trigger
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_status();

-- Validation trigger for max_participants based on activity
CREATE OR REPLACE FUNCTION public.validate_session_max_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.activity = 'kitesurf' AND NEW.max_participants > 4 THEN
    NEW.max_participants := 4;
  ELSIF NEW.activity = 'wingfoil' AND NEW.max_participants > 3 THEN
    NEW.max_participants := 3;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_max_participants_trigger
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_max_participants();
