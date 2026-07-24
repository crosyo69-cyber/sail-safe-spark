-- 1) Restrict SELECT on daily_groups.notes to admins / service_role only.
--    Public/authenticated keep read access to all other columns via existing RLS policy.
REVOKE SELECT (notes) ON public.daily_groups FROM anon, authenticated, PUBLIC;
GRANT SELECT (notes) ON public.daily_groups TO service_role;

-- 2) Fix mutable search_path on default_max_participants.
CREATE OR REPLACE FUNCTION public.default_max_participants(_activity activity_type)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE _activity
    WHEN 'kitesurf' THEN 4
    WHEN 'wingfoil' THEN 3
    WHEN 'pumpfoil' THEN 4
    WHEN 'foil_tracte' THEN 4
    WHEN 'stage_100_glisse' THEN 4
    ELSE 4
  END
$function$;