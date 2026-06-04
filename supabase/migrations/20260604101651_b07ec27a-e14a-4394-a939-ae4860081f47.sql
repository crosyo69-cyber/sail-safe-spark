
CREATE OR REPLACE FUNCTION public.get_package_credits_history(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH pkg AS (
    SELECT id FROM public.client_packages WHERE package_code = p_code LIMIT 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'delta', h.delta,
    'kind', h.kind,
    'reason', h.reason,
    'balance_after', h.balance_after,
    'created_at', h.created_at,
    'is_weather', (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%météo%')
                  OR (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%meteo%')
  ) ORDER BY h.created_at DESC), '[]'::jsonb)
  FROM public.package_credit_history h
  WHERE h.package_id = (SELECT id FROM pkg);
$$;

GRANT EXECUTE ON FUNCTION public.get_package_credits_history(text) TO anon, authenticated;
