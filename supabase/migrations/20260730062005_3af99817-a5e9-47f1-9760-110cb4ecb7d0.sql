REVOKE SELECT ON public.daily_groups FROM anon, authenticated, PUBLIC;
GRANT SELECT (id, date, activity, group_index, max_participants, status, created_at, updated_at) ON public.daily_groups TO anon, authenticated;
GRANT ALL ON public.daily_groups TO service_role;