-- 1. Birth date for birthday trigger
ALTER TABLE public.crm_client_profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- 2. Automations
CREATE TABLE public.marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT false,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  segment_id uuid REFERENCES public.marketing_segments(id) ON DELETE SET NULL,
  segment_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_topic text,
  email_subject text NOT NULL DEFAULT '',
  email_html text NOT NULL DEFAULT '',
  email_cta_label text,
  email_cta_url text,
  delay_days integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 100,
  dedupe_window_days integer NOT NULL DEFAULT 30,
  max_recipients integer NOT NULL DEFAULT 500,
  last_run_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_automations_trigger_check CHECK (trigger_type IN (
    'credit_expiring','new_reservation','first_reservation','no_booking_since',
    'birthday','weather_recredit','new_package','weather_exceptional'
  )),
  CONSTRAINT marketing_automations_delay_check CHECK (delay_days BETWEEN 0 AND 365),
  CONSTRAINT marketing_automations_dedupe_check CHECK (dedupe_window_days BETWEEN 0 AND 3650)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automations TO authenticated;
GRANT ALL ON public.marketing_automations TO service_role;
ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage automations" ON public.marketing_automations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marketing_automations_updated_at
  BEFORE UPDATE ON public.marketing_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Runs journal
CREATE TABLE public.marketing_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'test',
  status text NOT NULL DEFAULT 'success',
  recipients_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  triggered_by text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_automation_runs_mode_check CHECK (mode IN ('test','live')),
  CONSTRAINT marketing_automation_runs_status_check CHECK (status IN ('success','error','skipped','running'))
);

GRANT SELECT ON public.marketing_automation_runs TO authenticated;
GRANT ALL ON public.marketing_automation_runs TO service_role;
ALTER TABLE public.marketing_automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read automation runs" ON public.marketing_automation_runs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_automation_runs_automation ON public.marketing_automation_runs(automation_id, started_at DESC);

CREATE TRIGGER update_marketing_automation_runs_updated_at
  BEFORE UPDATE ON public.marketing_automation_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Sends (dedupe)
CREATE TABLE public.marketing_automation_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.marketing_automation_runs(id) ON DELETE SET NULL,
  email text NOT NULL,
  dedupe_key text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, email, dedupe_key)
);

GRANT SELECT ON public.marketing_automation_sends TO authenticated;
GRANT ALL ON public.marketing_automation_sends TO service_role;
ALTER TABLE public.marketing_automation_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read automation sends" ON public.marketing_automation_sends
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_automation_sends_lookup ON public.marketing_automation_sends(automation_id, email, sent_at DESC);

-- 5. Candidates engine (uses get_marketing_segment exclusively)
CREATE OR REPLACE FUNCTION public.marketing_automation_candidates(
  p_automation_id uuid,
  p_limit integer DEFAULT NULL
)
RETURNS TABLE (
  email text,
  first_name text,
  last_name text,
  dedupe_key text,
  context jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.marketing_automations%ROWTYPE;
  v_def jsonb;
  v_days integer;
  v_topics jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO a FROM public.marketing_automations WHERE id = p_automation_id;
  IF a.id IS NULL THEN
    RAISE EXCEPTION 'automation not found';
  END IF;

  -- Base definition: saved segment if any, else inline definition
  v_def := COALESCE(
    (SELECT s.definition FROM public.marketing_segments s WHERE s.id = a.segment_id),
    a.segment_definition,
    '{}'::jsonb
  );

  -- Consent is always enforced, test profiles always excluded
  v_def := v_def || jsonb_build_object('consent', 'yes', 'include_test', false);

  -- Marketing preference (topic) enforcement
  IF a.required_topic IS NOT NULL AND a.required_topic <> '' THEN
    v_topics := COALESCE(v_def->'topics', '[]'::jsonb);
    IF NOT (v_topics @> to_jsonb(ARRAY[a.required_topic])) THEN
      v_topics := v_topics || to_jsonb(ARRAY[a.required_topic]);
    END IF;
    v_def := v_def || jsonb_build_object('topics', v_topics);
  END IF;

  v_days := GREATEST(COALESCE((a.trigger_config->>'days')::int, a.delay_days, 0), 0);

  RETURN QUERY
  WITH seg AS (
    SELECT * FROM public.get_marketing_segment(v_def, NULL)
  ),
  enriched AS (
    SELECT
      s.*,
      p.birth_date,
      (SELECT max(sc.created_at) FROM public.session_credits sc
        JOIN public.client_packages cp ON cp.id = sc.package_id
        WHERE lower(cp.email) = lower(s.email)
          AND (sc.origin ILIKE '%weather%' OR sc.origin ILIKE '%meteo%'
               OR sc.reason ILIKE '%météo%' OR sc.reason ILIKE '%meteo%')) AS last_weather_recredit,
      (SELECT max(cp.created_at) FROM public.client_packages cp
        WHERE lower(cp.email) = lower(s.email)) AS last_package_at
    FROM seg s
    LEFT JOIN public.crm_client_profiles p ON lower(p.email) = lower(s.email)
  )
  SELECT
    e.email,
    e.first_name,
    e.last_name,
    CASE a.trigger_type
      WHEN 'credit_expiring'   THEN 'exp:' || to_char(e.next_expiry, 'YYYY-MM-DD')
      WHEN 'new_reservation'   THEN 'res:' || to_char(e.last_date, 'YYYY-MM-DD')
      WHEN 'first_reservation' THEN 'first:' || to_char(e.first_date, 'YYYY-MM-DD')
      WHEN 'no_booking_since'  THEN 'dormant:' || to_char(now(), 'YYYY-MM')
      WHEN 'birthday'          THEN 'bday:' || to_char(now(), 'YYYY')
      WHEN 'weather_recredit'  THEN 'wrc:' || to_char(e.last_weather_recredit, 'YYYY-MM-DD')
      WHEN 'new_package'       THEN 'pack:' || to_char(e.last_package_at, 'YYYY-MM-DD')
      ELSE 'run:' || to_char(now(), 'YYYY-MM-DD')
    END AS dedupe_key,
    jsonb_build_object(
      'level', e.level,
      'lifecycle', e.lifecycle,
      'activities', e.activities,
      'credits_remaining', e.credits_remaining,
      'next_expiry', e.next_expiry,
      'last_date', e.last_date,
      'first_date', e.first_date,
      'reservations_count', e.reservations_count,
      'packages_count', e.packages_count,
      'revenue', e.revenue
    ) AS context
  FROM enriched e
  WHERE
    CASE a.trigger_type
      WHEN 'credit_expiring' THEN
        e.credits_remaining > 0 AND e.next_expiry IS NOT NULL
        AND e.next_expiry::date BETWEEN current_date AND (current_date + make_interval(days => GREATEST(v_days, 1)))::date
      WHEN 'new_reservation' THEN
        e.last_date IS NOT NULL
        AND e.last_date::date >= (current_date - make_interval(days => GREATEST(v_days, 1)))::date
      WHEN 'first_reservation' THEN
        e.reservations_count = 1 AND e.first_date IS NOT NULL
        AND e.first_date::date >= (current_date - make_interval(days => GREATEST(v_days, 30)))::date
      WHEN 'no_booking_since' THEN
        e.last_date IS NULL
        OR e.last_date::date <= (current_date - make_interval(days => GREATEST(v_days, 30)))::date
      WHEN 'birthday' THEN
        e.birth_date IS NOT NULL
        AND to_char(e.birth_date, 'MM-DD') = to_char((current_date + make_interval(days => a.delay_days))::date, 'MM-DD')
      WHEN 'weather_recredit' THEN
        e.last_weather_recredit IS NOT NULL
        AND e.last_weather_recredit::date >= (current_date - make_interval(days => GREATEST(v_days, 1)))::date
      WHEN 'new_package' THEN
        e.last_package_at IS NOT NULL
        AND e.last_package_at::date >= (current_date - make_interval(days => GREATEST(v_days, 1)))::date
      ELSE false
    END
  ORDER BY e.email
  LIMIT COALESCE(p_limit, a.max_recipients, 500);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automation_candidates(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_automation_candidates(uuid, integer) TO authenticated, service_role;

-- 6. Due automations (daily scheduler)
CREATE OR REPLACE FUNCTION public.marketing_automations_due()
RETURNS SETOF public.marketing_automations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.marketing_automations
  WHERE active = true AND next_run_at <= now()
  ORDER BY priority ASC, created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.marketing_automations_due() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_automations_due() TO authenticated, service_role;

-- 7. Schedule next run (daily)
CREATE OR REPLACE FUNCTION public.marketing_automation_schedule_next(p_automation_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next timestamptz;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  v_next := (date_trunc('day', now() AT TIME ZONE 'Europe/Paris') + interval '1 day' + interval '8 hours') AT TIME ZONE 'Europe/Paris';
  UPDATE public.marketing_automations
    SET last_run_at = now(), next_run_at = v_next
    WHERE id = p_automation_id;
  RETURN v_next;
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_automation_schedule_next(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_automation_schedule_next(uuid) TO authenticated, service_role;