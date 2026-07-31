DROP FUNCTION IF EXISTS public.get_marketing_segment(jsonb, int);

CREATE OR REPLACE FUNCTION public.get_marketing_segment(
  p_definition jsonb DEFAULT '{}'::jsonb,
  p_limit int DEFAULT NULL
)
RETURNS TABLE(
  email text, first_name text, last_name text, phone text,
  activities text[], topics text[], consent boolean, level text,
  lifecycle text, first_date date, last_date date, reservations_count int,
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
  IF NOT public.marketing_is_internal_caller() THEN
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
    b.first_date, b.last_date, b.reservations_count, b.credits_remaining, b.next_expiry,
    b.revenue, b.avg_basket, b.packages_count,
    b.department, b.country, b.distance_km
  FROM public.marketing_segment_base() b
  WHERE
    (v_include_test OR NOT b.is_test)
    AND (v_include_suppressed OR NOT b.suppressed)
    AND (v_consent = 'all'
         OR (v_consent = 'yes' AND b.consent)
         OR (v_consent = 'no' AND NOT b.consent))
    AND (cardinality(v_activities) = 0
         OR (v_match_any_activity AND b.activities && v_activities)
         OR ((NOT v_match_any_activity) AND b.activities @> v_activities))
    AND (cardinality(v_topics) = 0 OR b.topics && v_topics)
    AND (cardinality(v_levels) = 0 OR b.level = ANY(v_levels))
    AND (cardinality(v_lifecycle) = 0 OR b.lifecycle = ANY(v_lifecycle))
    AND (cardinality(v_credits) = 0 OR (
      ('none' = ANY(v_credits) AND b.credits_remaining = 0)
      OR ('1_3' = ANY(v_credits) AND b.credits_remaining BETWEEN 1 AND 3)
      OR ('gt3' = ANY(v_credits) AND b.credits_remaining > 3)
      OR ('expiring_30d' = ANY(v_credits) AND b.credits_remaining > 0
          AND b.next_expiry IS NOT NULL AND b.next_expiry <= now() + interval '30 days')
    ))
    AND (d->>'last_booking_after' IS NULL OR b.last_date >= (d->>'last_booking_after')::date)
    AND (d->>'last_booking_before' IS NULL OR b.last_date <= (d->>'last_booking_before')::date)
    AND (d->>'min_bookings' IS NULL OR b.reservations_count >= (d->>'min_bookings')::int)
    AND (d->>'max_bookings' IS NULL OR b.reservations_count <= (d->>'max_bookings')::int)
    AND (d->>'not_booked_since_months' IS NULL
         OR b.last_date IS NULL
         OR b.last_date < (current_date - ((d->>'not_booked_since_months')::int * 30)))
    AND (d->>'min_revenue' IS NULL OR b.revenue >= (d->>'min_revenue')::numeric)
    AND (d->>'max_revenue' IS NULL OR b.revenue <= (d->>'max_revenue')::numeric)
    AND (d->>'min_avg_basket' IS NULL OR b.avg_basket >= (d->>'min_avg_basket')::numeric)
    AND (d->>'min_packages' IS NULL OR b.packages_count >= (d->>'min_packages')::int)
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
