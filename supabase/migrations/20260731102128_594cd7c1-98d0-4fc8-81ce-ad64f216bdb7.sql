-- 1) Location + level fields on CRM profiles
ALTER TABLE public.crm_client_profiles
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS level text;

-- 2) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_email_lower ON public.reservations (lower(email));
CREATE INDEX IF NOT EXISTS idx_client_packages_email_lower ON public.client_packages (lower(email));
CREATE INDEX IF NOT EXISTS idx_crm_profiles_email_lower ON public.crm_client_profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_marketing_preferences_email_lower ON public.marketing_preferences (lower(email));
CREATE INDEX IF NOT EXISTS idx_session_credits_pkg_status ON public.session_credits (package_id, status);
CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email_lower ON public.suppressed_emails (lower(email));
CREATE INDEX IF NOT EXISTS idx_crm_profiles_consent ON public.crm_client_profiles (marketing_consent);

-- 3) Saved segments
CREATE TABLE IF NOT EXISTS public.marketing_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_segments TO authenticated;
GRANT ALL ON public.marketing_segments TO service_role;
ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage marketing segments" ON public.marketing_segments;
CREATE POLICY "Admins manage marketing segments"
ON public.marketing_segments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_marketing_segments_updated_at ON public.marketing_segments;
CREATE TRIGGER trg_marketing_segments_updated_at
BEFORE UPDATE ON public.marketing_segments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS idx_marketing_segments_name ON public.marketing_segments (lower(name));

-- 4) Single source of truth: segment base
CREATE OR REPLACE FUNCTION public.marketing_segment_base()
RETURNS TABLE(
  email text, first_name text, last_name text, phone text,
  first_seen timestamptz, last_date date, first_date date,
  reservations_count int, packages_count int,
  credits_remaining int, next_expiry timestamptz,
  revenue numeric, avg_basket numeric,
  activities text[], topics text[], consent boolean,
  level text, lifecycle text,
  postal_code text, department text, country text, distance_km numeric,
  is_test boolean, suppressed boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    b.email,
    b.first_name, b.last_name, b.phone,
    b.first_seen,
    NULLIF(b.last_date, '1900-01-01')::date,
    NULLIF(b.first_date, '2999-01-01')::date,
    b.reservations_count,
    b.packages_count,
    b.credits_remaining,
    b.next_expiry,
    b.revenue,
    CASE WHEN (b.reservations_count + b.packages_count) > 0
         THEN round(b.revenue / (b.reservations_count + b.packages_count), 2)
         ELSE 0 END,
    coalesce(b.activities, '{}'),
    coalesce(mp.topics, '{}'),
    coalesce(mp.consent, pr.marketing_consent, false),
    coalesce(
      pr.level,
      (SELECT r.skill_level::text FROM public.reservations r
        WHERE lower(r.email) = b.email AND r.skill_level IS NOT NULL
        ORDER BY r.created_at DESC LIMIT 1)
    ),
    CASE
      WHEN b.reservations_count = 0 AND b.packages_count = 0 THEN 'prospect'
      WHEN b.first_seen >= (now() - interval '30 days') THEN 'nouveau'
      WHEN NULLIF(b.last_date, '1900-01-01') >= (current_date - 365) THEN 'active'
      ELSE 'inactive'
    END,
    pr.postal_code,
    NULLIF(left(coalesce(pr.postal_code, ''), 2), ''),
    pr.country,
    pr.distance_km,
    coalesce(pr.is_test, false),
    EXISTS (SELECT 1 FROM public.suppressed_emails s WHERE lower(s.email) = b.email)
  FROM public.crm_client_base() b
  LEFT JOIN public.crm_client_profiles pr ON lower(pr.email) = b.email
  LEFT JOIN public.marketing_preferences mp ON lower(mp.email) = b.email
  WHERE b.email IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.marketing_segment_base() FROM anon, authenticated;

-- 5) THE segment engine
CREATE OR REPLACE FUNCTION public.get_marketing_segment(
  p_definition jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT NULL
)
RETURNS TABLE(
  email text, first_name text, last_name text, phone text,
  activities text[], topics text[], consent boolean, level text,
  lifecycle text, last_date date, reservations_count int,
  credits_remaining int, next_expiry timestamptz,
  revenue numeric, avg_basket numeric, packages_count int,
  department text, country text, distance_km numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d jsonb := coalesce(p_definition, '{}'::jsonb);
  v_activities text[];
  v_topics text[];
  v_levels text[];
  v_lifecycle text[];
  v_credits text[];
  v_departments text[];
  v_countries text[];
  v_consent text := coalesce(d->>'consent', 'yes');
  v_include_test boolean := coalesce((d->>'include_test')::boolean, false);
  v_include_suppressed boolean := coalesce((d->>'include_suppressed')::boolean, false);
  v_match_any_activity boolean := coalesce((d->>'match_any_activity')::boolean, true);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT coalesce(array_agg(x), '{}') INTO v_activities FROM jsonb_array_elements_text(coalesce(d->'activities','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_topics FROM jsonb_array_elements_text(coalesce(d->'topics','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_levels FROM jsonb_array_elements_text(coalesce(d->'levels','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_lifecycle FROM jsonb_array_elements_text(coalesce(d->'lifecycle','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_credits FROM jsonb_array_elements_text(coalesce(d->'credits','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_departments FROM jsonb_array_elements_text(coalesce(d->'departments','[]'::jsonb)) x;
  SELECT coalesce(array_agg(x), '{}') INTO v_countries FROM jsonb_array_elements_text(coalesce(d->'countries','[]'::jsonb)) x;

  RETURN QUERY
  SELECT DISTINCT ON (b.email)
    b.email, b.first_name, b.last_name, b.phone,
    b.activities, b.topics, b.consent, b.level, b.lifecycle,
    b.last_date, b.reservations_count, b.credits_remaining, b.next_expiry,
    b.revenue, b.avg_basket, b.packages_count,
    b.department, b.country, b.distance_km
  FROM public.marketing_segment_base() b
  WHERE
    (v_include_test OR NOT b.is_test)
    AND (v_include_suppressed OR NOT b.suppressed)
    -- consent
    AND (v_consent = 'all'
         OR (v_consent = 'yes' AND b.consent)
         OR (v_consent = 'no' AND NOT b.consent))
    -- activities
    AND (cardinality(v_activities) = 0
         OR (v_match_any_activity AND b.activities && v_activities)
         OR ((NOT v_match_any_activity) AND b.activities @> v_activities))
    -- marketing topics
    AND (cardinality(v_topics) = 0 OR b.topics && v_topics)
    -- level
    AND (cardinality(v_levels) = 0 OR b.level = ANY(v_levels))
    -- lifecycle
    AND (cardinality(v_lifecycle) = 0 OR b.lifecycle = ANY(v_lifecycle))
    -- credits buckets (OR between buckets)
    AND (cardinality(v_credits) = 0 OR (
      ('none' = ANY(v_credits) AND b.credits_remaining = 0)
      OR ('1_3' = ANY(v_credits) AND b.credits_remaining BETWEEN 1 AND 3)
      OR ('gt3' = ANY(v_credits) AND b.credits_remaining > 3)
      OR ('expiring_30d' = ANY(v_credits) AND b.credits_remaining > 0
          AND b.next_expiry IS NOT NULL AND b.next_expiry <= now() + interval '30 days')
    ))
    -- bookings
    AND (d->>'last_booking_after' IS NULL OR b.last_date >= (d->>'last_booking_after')::date)
    AND (d->>'last_booking_before' IS NULL OR b.last_date <= (d->>'last_booking_before')::date)
    AND (d->>'min_bookings' IS NULL OR b.reservations_count >= (d->>'min_bookings')::int)
    AND (d->>'max_bookings' IS NULL OR b.reservations_count <= (d->>'max_bookings')::int)
    AND (d->>'not_booked_since_months' IS NULL
         OR b.last_date IS NULL
         OR b.last_date < (current_date - ((d->>'not_booked_since_months')::int * 30)))
    -- spending
    AND (d->>'min_revenue' IS NULL OR b.revenue >= (d->>'min_revenue')::numeric)
    AND (d->>'max_revenue' IS NULL OR b.revenue <= (d->>'max_revenue')::numeric)
    AND (d->>'min_avg_basket' IS NULL OR b.avg_basket >= (d->>'min_avg_basket')::numeric)
    AND (d->>'min_packages' IS NULL OR b.packages_count >= (d->>'min_packages')::int)
    -- location
    AND (cardinality(v_departments) = 0 OR b.department = ANY(v_departments))
    AND (cardinality(v_countries) = 0 OR b.country = ANY(v_countries))
    AND (d->>'max_distance_km' IS NULL
         OR (b.distance_km IS NOT NULL AND b.distance_km <= (d->>'max_distance_km')::numeric))
  ORDER BY b.email, b.last_date DESC NULLS LAST
  LIMIT CASE WHEN p_limit IS NULL OR p_limit <= 0 THEN NULL ELSE p_limit END;
END;
$$;

REVOKE ALL ON FUNCTION public.get_marketing_segment(jsonb, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_marketing_segment(jsonb, int) TO authenticated, service_role;

-- 6) Real-time estimate + preview
CREATE OR REPLACE FUNCTION public.marketing_segment_estimate(p_definition jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total int;
  v_clients int;
  v_emails int;
  v_sms int;
  v_preview jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT count(*)::int INTO v_total FROM public.marketing_segment_base() b WHERE NOT b.is_test;

  SELECT count(*)::int,
         count(*) FILTER (WHERE s.email IS NOT NULL)::int,
         count(*) FILTER (WHERE coalesce(s.phone, '') <> '')::int
  INTO v_clients, v_emails, v_sms
  FROM public.get_marketing_segment(p_definition, NULL) s;

  SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_preview
  FROM (
    SELECT s.email, s.first_name, s.last_name, s.activities, s.last_date, s.consent, s.level
    FROM public.get_marketing_segment(p_definition, NULL) s
    ORDER BY s.last_date DESC NULLS LAST, s.email
    LIMIT 20
  ) t;

  RETURN jsonb_build_object(
    'clients', v_clients,
    'emails', v_emails,
    'sms', v_sms,
    'total_base', v_total,
    'percent', CASE WHEN v_total > 0 THEN round((v_clients::numeric / v_total) * 100, 1) ELSE 0 END,
    'preview', v_preview
  );
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_segment_estimate(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.marketing_segment_estimate(jsonb) TO authenticated, service_role;
