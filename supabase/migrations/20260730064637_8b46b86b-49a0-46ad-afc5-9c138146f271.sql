CREATE OR REPLACE FUNCTION public.marketing_estimate_audience(p_audience jsonb)
RETURNS TABLE(recipients integer, emails text[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activities text[];
  v_lifecycle text[];
  v_with_credits boolean := COALESCE((p_audience->>'with_credits')::boolean, false);
  v_expiring boolean := COALESCE((p_audience->>'expiring_30d')::boolean, false);
  v_optin boolean := COALESCE((p_audience->>'marketing_consent_only')::boolean, false);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT COALESCE(array_agg(x), '{}') INTO v_activities
  FROM jsonb_array_elements_text(COALESCE(p_audience->'activities', '[]'::jsonb)) x;

  SELECT COALESCE(array_agg(x), '{}') INTO v_lifecycle
  FROM jsonb_array_elements_text(COALESCE(p_audience->'lifecycle', '[]'::jsonb)) x;

  RETURN QUERY
  WITH base AS (
    SELECT b.*,
      CASE
        WHEN b.reservations_count = 0 AND b.packages_count = 0 THEN 'prospect'
        WHEN b.last_date IS NOT NULL AND b.last_date >= (CURRENT_DATE - 365) THEN 'active'
        ELSE 'inactive'
      END AS lifecycle
    FROM public.crm_client_base() b
  ), filtered AS (
    SELECT b.email
    FROM base b
    WHERE (cardinality(v_activities) = 0 OR b.activities && v_activities)
      AND (cardinality(v_lifecycle) = 0 OR b.lifecycle = ANY(v_lifecycle))
      AND (NOT v_with_credits OR b.credits_remaining > 0)
      AND (NOT v_expiring OR (b.next_expiry IS NOT NULL AND b.next_expiry <= now() + interval '30 days' AND b.credits_remaining > 0))
      AND (NOT v_optin OR b.marketing_consent = true)
      AND b.email IS NOT NULL
      AND b.email NOT IN (SELECT s.email FROM public.suppressed_emails s)
  )
  SELECT COUNT(*)::integer, COALESCE(array_agg(f.email), '{}') FROM filtered f;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.marketing_estimate_audience(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_estimate_audience(jsonb) TO authenticated;