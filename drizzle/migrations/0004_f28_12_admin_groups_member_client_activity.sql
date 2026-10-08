CREATE OR REPLACE FUNCTION public.admin_list_daily_groups(p_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', dg.id,
    'activity', dg.activity,
    'group_index', dg.group_index,
    'max_participants', dg.max_participants,
    'status', dg.status,
    'notes', dg.notes,
    'taken',
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0),
    'members', (
      SELECT COALESCE(jsonb_agg(m ORDER BY m->>'name'), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'kind','visitor','id',r.id,
          'name', r.first_name || ' ' || r.last_name,
          'email', r.email, 'phone', r.phone,
          'participants', r.participants,
          'client_activity', r.client_activity,
          'booked_at', r.created_at
        ) AS m
        FROM public.reservations r
        WHERE r.daily_group_id = dg.id AND r.status <> 'cancelled'
        UNION ALL
        SELECT jsonb_build_object(
          'kind','package','id',pb.id,
          'name', cp.first_name || ' ' || cp.last_name,
          'email', cp.email, 'phone', cp.phone,
          'package_code', cp.package_code,
          'participants', 1,
          'client_activity', cp.activity,
          'booked_at', pb.created_at
        )
        FROM public.package_bookings pb
        JOIN public.client_packages cp ON cp.id = pb.package_id
        WHERE pb.daily_group_id = dg.id AND pb.status = 'confirmed'
      ) t
    )
  ) ORDER BY dg.activity, dg.group_index), '[]'::jsonb)
  INTO v_result
  FROM public.daily_groups dg
  WHERE dg.date = p_date;

  RETURN v_result;
END;
$$;