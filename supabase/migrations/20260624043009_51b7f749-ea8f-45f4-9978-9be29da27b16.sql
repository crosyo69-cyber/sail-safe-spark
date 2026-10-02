-- Revoke read access on admin-only sensitive columns from public roles
REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM anon;
REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM authenticated;

-- Re-grant read access on all non-sensitive columns to public roles so that
-- existing `select('*')` queries from the booking flow keep working.
GRANT SELECT (id, date, time_slot, activity, max_participants, status,
              weather_condition, created_at, updated_at, is_last_minute,
              last_minute_label, published_at, stage_group_id)
  ON public.sessions TO anon, authenticated;

-- Service role keeps full access (edge functions / admin scripts)
GRANT SELECT ON public.sessions TO service_role;

-- Admin RPC to fetch the sensitive columns for a set of sessions.
-- Returns no rows for callers that are not admins.
CREATE OR REPLACE FUNCTION public.admin_get_session_extras(p_session_ids uuid[])
RETURNS TABLE (
  id uuid,
  notes text,
  weather_note text,
  cancellation_reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.notes, s.weather_note, s.cancellation_reason
  FROM public.sessions s
  WHERE s.id = ANY(p_session_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;

REVOKE ALL ON FUNCTION public.admin_get_session_extras(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_get_session_extras(uuid[]) TO authenticated;