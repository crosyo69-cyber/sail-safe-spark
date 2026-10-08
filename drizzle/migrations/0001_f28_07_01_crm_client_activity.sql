-- F-28-07-01: CRM visitor-reservation activity = reservations.client_activity (client), not daily_groups.activity (group).
CREATE OR REPLACE FUNCTION public.crm_client_base()
 RETURNS TABLE(email text, first_name text, last_name text, phone text, first_seen timestamp with time zone, last_date date, first_date date, reservations_count integer, participants_count integer, packages_count integer, sessions_purchased integer, sessions_used integer, credits_remaining integer, credits_consumed integer, credits_expired integer, next_expiry timestamp with time zone, revenue numeric, activities text[], marketing_consent boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH people AS (
  SELECT lower(s.email) AS email,
         (array_agg(s.first_name ORDER BY s.created_at DESC))[1] AS first_name,
         (array_agg(s.last_name ORDER BY s.created_at DESC))[1] AS last_name,
         (array_agg(s.phone ORDER BY s.created_at DESC))[1] AS phone,
         min(s.created_at) AS first_seen
  FROM (
    SELECT email, first_name, last_name, phone, created_at FROM public.reservations WHERE email IS NOT NULL
    UNION ALL
    SELECT email, first_name, last_name, phone, created_at FROM public.client_packages WHERE email IS NOT NULL
  ) s
  GROUP BY 1
),
res AS (
  SELECT lower(r.email) AS email,
         count(*) FILTER (WHERE r.status <> 'cancelled')::int AS n_res,
         coalesce(sum(r.participants) FILTER (WHERE r.status <> 'cancelled'), 0)::int AS n_part,
         count(*) FILTER (WHERE r.stripe_session_id IS NOT NULL AND r.status <> 'cancelled')::int AS n_paid,
         max(g.date) AS last_date, min(g.date) AS first_date,
         array_remove(array_agg(DISTINCT r.client_activity::text), NULL) AS acts
  FROM public.reservations r
  LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
  GROUP BY 1
),
pk AS (
  SELECT lower(cp.email) AS email,
         count(*)::int AS n_pack,
         coalesce(sum(cp.deposit_amount), 0)::numeric AS deposits,
         coalesce(sum(cp.total_sessions), 0)::int AS tot_sessions,
         coalesce(sum(cp.used_sessions), 0)::int AS used_sessions,
         array_remove(array_agg(DISTINCT cp.activity::text), NULL) AS acts
  FROM public.client_packages cp
  GROUP BY 1
),
cr AS (
  SELECT lower(cp.email) AS email,
         count(*) FILTER (WHERE sc.status = 'available')::int AS remaining,
         count(*) FILTER (WHERE sc.status = 'consumed')::int AS consumed,
         count(*) FILTER (WHERE sc.status = 'expired')::int AS expired,
         min(sc.expires_at) FILTER (WHERE sc.status = 'available') AS next_exp
  FROM public.session_credits sc
  JOIN public.client_packages cp ON cp.id = sc.package_id
  GROUP BY 1
),
pbk AS (
  SELECT lower(cp.email) AS email,
         count(*)::int AS n_bk,
         max(g.date) AS last_date, min(g.date) AS first_date
  FROM public.package_bookings pb
  JOIN public.client_packages cp ON cp.id = pb.package_id
  LEFT JOIN public.daily_groups g ON g.id = pb.daily_group_id
  WHERE pb.status <> 'cancelled'
  GROUP BY 1
)
SELECT p.email,
       coalesce(pr.first_name, p.first_name),
       coalesce(pr.last_name, p.last_name),
       coalesce(pr.phone, p.phone),
       p.first_seen,
       GREATEST(coalesce(res.last_date, '1900-01-01'), coalesce(pbk.last_date, '1900-01-01')) AS last_date,
       LEAST(coalesce(res.first_date, '2999-01-01'), coalesce(pbk.first_date, '2999-01-01')) AS first_date,
       coalesce(res.n_res, 0) + coalesce(pbk.n_bk, 0) AS reservations_count,
       coalesce(res.n_part, 0) + coalesce(pbk.n_bk, 0) AS participants_count,
       coalesce(pk.n_pack, 0),
       coalesce(pk.tot_sessions, 0),
       coalesce(pk.used_sessions, 0),
       coalesce(cr.remaining, 0),
       coalesce(cr.consumed, 0),
       coalesce(cr.expired, 0),
       cr.next_exp,
       coalesce(pk.deposits, 0) + (coalesce(res.n_paid, 0) * 50)::numeric AS revenue,
       (SELECT array_agg(DISTINCT a) FROM unnest(coalesce(res.acts, '{}') || coalesce(pk.acts, '{}')) a) AS activities,
       coalesce(pr.marketing_consent, false)
FROM people p
LEFT JOIN res ON res.email = p.email
LEFT JOIN pk ON pk.email = p.email
LEFT JOIN cr ON cr.email = p.email
LEFT JOIN pbk ON pbk.email = p.email
LEFT JOIN public.crm_client_profiles pr ON lower(pr.email) = p.email;
$function$;

CREATE OR REPLACE FUNCTION public.crm_client_detail(p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  e text := lower(trim(p_email));
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT jsonb_build_object(
    'summary', (SELECT to_jsonb(b) FROM public.crm_client_base() b WHERE b.email = e),
    'profile', (SELECT to_jsonb(pr) FROM public.crm_client_profiles pr WHERE lower(pr.email) = e),
    'levels', (SELECT coalesce(jsonb_agg(to_jsonb(l) ORDER BY l.activity), '[]'::jsonb)
               FROM public.crm_client_levels l WHERE lower(l.email) = e),
    'documents', (SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC), '[]'::jsonb)
                  FROM public.crm_client_documents d WHERE lower(d.email) = e),
    'packages', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                    'id', cp.id, 'code', cp.package_code, 'activity', cp.activity,
                    'package_type', cp.package_type, 'status', cp.status,
                    'total_sessions', cp.total_sessions, 'used_sessions', cp.used_sessions,
                    'deposit_amount', cp.deposit_amount, 'deposit_paid_at', cp.deposit_paid_at,
                    'stripe_session_id', cp.stripe_session_id,
                    'expires_at', cp.expires_at, 'created_at', cp.created_at
                  ) ORDER BY cp.created_at DESC), '[]'::jsonb)
                  FROM public.client_packages cp WHERE lower(cp.email) = e),
    'bookings', (
      SELECT coalesce(jsonb_agg(x ORDER BY x->>'date' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'kind', 'visitor', 'id', r.id, 'date', g.date, 'activity', r.client_activity,
          'participants', r.participants, 'status', r.status,
          'skill_level', r.skill_level, 'created_at', r.created_at,
          'stripe_session_id', r.stripe_session_id
        ) AS x
        FROM public.reservations r
        LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
        WHERE lower(r.email) = e
        UNION ALL
        SELECT jsonb_build_object(
          'kind', 'package', 'id', pb.id, 'date', g.date, 'activity', g.activity,
          'participants', 1, 'status', pb.status,
          'skill_level', NULL, 'created_at', pb.created_at,
          'stripe_session_id', NULL
        )
        FROM public.package_bookings pb
        JOIN public.client_packages cp ON cp.id = pb.package_id
        LEFT JOIN public.daily_groups g ON g.id = pb.daily_group_id
        WHERE lower(cp.email) = e
      ) s
    ),
    'credits', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                   'id', sc.id, 'activity', sc.activity, 'origin', sc.origin,
                   'status', sc.status, 'reason', sc.reason,
                   'created_at', sc.created_at, 'expires_at', sc.expires_at,
                   'consumed_at', sc.consumed_at, 'package_code', cp.package_code
                 ) ORDER BY sc.expires_at), '[]'::jsonb)
                 FROM public.session_credits sc
                 JOIN public.client_packages cp ON cp.id = sc.package_id
                 WHERE lower(cp.email) = e),
    'credit_history', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                   'id', h.id, 'delta', h.delta, 'kind', h.kind, 'action', h.action,
                   'reason', h.reason, 'activity', h.activity,
                   'balance_after', h.balance_after, 'created_at', h.created_at
                 ) ORDER BY h.created_at DESC), '[]'::jsonb)
                 FROM public.package_credit_history h
                 JOIN public.client_packages cp ON cp.id = h.package_id
                 WHERE lower(cp.email) = e),
    'payments', (
      SELECT coalesce(jsonb_agg(x ORDER BY x->>'paid_at' DESC), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'source', 'package', 'reference', cp.package_code,
          'amount', coalesce(cp.deposit_amount, 0), 'activity', cp.activity,
          'stripe_session_id', cp.stripe_session_id,
          'paid_at', coalesce(cp.deposit_paid_at, cp.created_at)
        ) AS x
        FROM public.client_packages cp
        WHERE lower(cp.email) = e AND cp.stripe_session_id IS NOT NULL
        UNION ALL
        SELECT jsonb_build_object(
          'source', 'reservation', 'reference', left(r.stripe_session_id, 18),
          'amount', 50, 'activity', r.client_activity,
          'stripe_session_id', r.stripe_session_id,
          'paid_at', r.created_at
        )
        FROM public.reservations r
        WHERE lower(r.email) = e AND r.stripe_session_id IS NOT NULL
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$function$;