-- =========================
-- CRM Client : tables
-- =========================
CREATE TABLE public.crm_client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  marketing_consent boolean NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  observations text,
  recommended_gear text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_client_profiles TO authenticated;
GRANT ALL ON public.crm_client_profiles TO service_role;
ALTER TABLE public.crm_client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm profiles" ON public.crm_client_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.crm_client_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  activity public.activity_type NOT NULL,
  level public.skill_level NOT NULL DEFAULT 'debutant',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, activity)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_client_levels TO authenticated;
GRANT ALL ON public.crm_client_levels TO service_role;
ALTER TABLE public.crm_client_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm levels" ON public.crm_client_levels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.crm_client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'autre',
  url text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_client_documents TO authenticated;
GRANT ALL ON public.crm_client_documents TO service_role;
ALTER TABLE public.crm_client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm documents" ON public.crm_client_documents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_levels_email ON public.crm_client_levels (email);
CREATE INDEX idx_crm_docs_email ON public.crm_client_documents (email);

CREATE TRIGGER trg_crm_profiles_updated BEFORE UPDATE ON public.crm_client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_levels_updated BEFORE UPDATE ON public.crm_client_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_crm_docs_updated BEFORE UPDATE ON public.crm_client_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Agrégat de base (interne)
-- =========================
CREATE OR REPLACE FUNCTION public.crm_client_base()
RETURNS TABLE (
  email text, first_name text, last_name text, phone text,
  first_seen timestamptz, last_date date, first_date date,
  reservations_count integer, participants_count integer,
  packages_count integer, sessions_purchased integer, sessions_used integer,
  credits_remaining integer, credits_consumed integer, credits_expired integer,
  next_expiry timestamptz, revenue numeric, activities text[],
  marketing_consent boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
         array_remove(array_agg(DISTINCT g.activity::text), NULL) AS acts
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
$$;

REVOKE EXECUTE ON FUNCTION public.crm_client_base() FROM PUBLIC, anon, authenticated;

-- =========================
-- Liste des clients
-- =========================
CREATE OR REPLACE FUNCTION public.crm_list_clients(
  p_query text DEFAULT NULL,
  p_activity text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_consent text DEFAULT NULL,
  p_limit integer DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.last_activity DESC NULLS LAST), '[]'::jsonb)
  INTO v
  FROM (
    SELECT b.email, b.first_name, b.last_name, b.phone,
           b.first_seen, b.reservations_count, b.participants_count,
           b.packages_count, b.sessions_purchased, b.sessions_used,
           b.credits_remaining, b.credits_consumed, b.credits_expired,
           b.next_expiry, b.revenue, coalesce(b.activities, '{}') AS activities,
           b.marketing_consent,
           NULLIF(b.last_date, '1900-01-01')::date AS last_activity,
           NULLIF(b.first_date, '2999-01-01')::date AS first_activity,
           CASE
             WHEN NULLIF(b.last_date, '1900-01-01') >= (current_date - 365) THEN 'active'
             WHEN b.last_date IS NULL OR b.last_date = '1900-01-01' THEN 'prospect'
             ELSE 'inactive'
           END AS lifecycle
    FROM public.crm_client_base() b
    WHERE (p_query IS NULL OR p_query = '' OR
           b.email ILIKE '%' || p_query || '%' OR
           coalesce(b.first_name, '') ILIKE '%' || p_query || '%' OR
           coalesce(b.last_name, '') ILIKE '%' || p_query || '%' OR
           coalesce(b.phone, '') ILIKE '%' || p_query || '%')
      AND (p_activity IS NULL OR p_activity = 'all' OR p_activity = ANY(coalesce(b.activities, '{}')))
      AND (p_consent IS NULL OR p_consent = 'all'
           OR (p_consent = 'yes' AND b.marketing_consent)
           OR (p_consent = 'no' AND NOT b.marketing_consent))
      AND (p_status IS NULL OR p_status = 'all'
           OR (p_status = 'active' AND NULLIF(b.last_date, '1900-01-01') >= (current_date - 365))
           OR (p_status = 'inactive' AND NULLIF(b.last_date, '1900-01-01') < (current_date - 365))
           OR (p_status = 'new' AND b.first_seen >= (now() - interval '30 days'))
           OR (p_status = 'credits' AND b.credits_remaining > 0))
    LIMIT greatest(coalesce(p_limit, 200), 1)
  ) t;

  RETURN v;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_list_clients(text, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_list_clients(text, text, text, text, integer) TO authenticated;

-- =========================
-- Fiche client détaillée
-- =========================
CREATE OR REPLACE FUNCTION public.crm_client_detail(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
          'kind', 'visitor', 'id', r.id, 'date', g.date, 'activity', g.activity,
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
          'amount', 50, 'activity', g.activity,
          'stripe_session_id', r.stripe_session_id,
          'paid_at', r.created_at
        )
        FROM public.reservations r
        LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
        WHERE lower(r.email) = e AND r.stripe_session_id IS NOT NULL
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_client_detail(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_client_detail(text) TO authenticated;

-- =========================
-- Tableau de bord CRM
-- =========================
CREATE OR REPLACE FUNCTION public.crm_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  WITH b AS (SELECT * FROM public.crm_client_base())
  SELECT jsonb_build_object(
    'total_clients', count(*),
    'new_clients_30d', count(*) FILTER (WHERE first_seen >= now() - interval '30 days'),
    'new_clients_365d', count(*) FILTER (WHERE first_seen >= now() - interval '365 days'),
    'active_clients', count(*) FILTER (WHERE NULLIF(last_date, '1900-01-01') >= current_date - 365),
    'inactive_clients', count(*) FILTER (WHERE NULLIF(last_date, '1900-01-01') < current_date - 365),
    'prospects', count(*) FILTER (WHERE NULLIF(last_date, '1900-01-01') IS NULL),
    'total_revenue', coalesce(sum(revenue), 0),
    'revenue_per_client', CASE WHEN count(*) FILTER (WHERE revenue > 0) > 0
        THEN round(coalesce(sum(revenue), 0) / count(*) FILTER (WHERE revenue > 0), 2) ELSE 0 END,
    'avg_basket', CASE WHEN coalesce(sum(reservations_count), 0) > 0
        THEN round(coalesce(sum(revenue), 0) / sum(reservations_count), 2) ELSE 0 END,
    'avg_sessions', CASE WHEN count(*) > 0
        THEN round(coalesce(sum(reservations_count), 0)::numeric / count(*), 2) ELSE 0 END,
    'loyalty_rate', CASE WHEN count(*) > 0
        THEN round(100.0 * count(*) FILTER (WHERE reservations_count > 1) / count(*), 1) ELSE 0 END,
    'repeat_clients', count(*) FILTER (WHERE reservations_count > 1),
    'credits_outstanding', coalesce(sum(credits_remaining), 0),
    'marketing_optin', count(*) FILTER (WHERE marketing_consent)
  ) INTO result FROM b;

  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_dashboard() TO authenticated;

-- =========================
-- Mutations CRM
-- =========================
CREATE OR REPLACE FUNCTION public.crm_upsert_profile(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_observations text DEFAULT NULL,
  p_recommended_gear text DEFAULT NULL,
  p_marketing_consent boolean DEFAULT NULL,
  p_tags text[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE row_out public.crm_client_profiles;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.crm_client_profiles AS p
    (email, first_name, last_name, phone, observations, recommended_gear, marketing_consent, marketing_consent_at, tags)
  VALUES (lower(trim(p_email)), p_first_name, p_last_name, p_phone, p_observations, p_recommended_gear,
          coalesce(p_marketing_consent, false),
          CASE WHEN coalesce(p_marketing_consent, false) THEN now() ELSE NULL END,
          coalesce(p_tags, '{}'))
  ON CONFLICT (email) DO UPDATE SET
    first_name = coalesce(EXCLUDED.first_name, p.first_name),
    last_name = coalesce(EXCLUDED.last_name, p.last_name),
    phone = coalesce(EXCLUDED.phone, p.phone),
    observations = coalesce(p_observations, p.observations),
    recommended_gear = coalesce(p_recommended_gear, p.recommended_gear),
    marketing_consent = coalesce(p_marketing_consent, p.marketing_consent),
    marketing_consent_at = CASE
      WHEN p_marketing_consent IS TRUE AND NOT p.marketing_consent THEN now()
      WHEN p_marketing_consent IS FALSE THEN NULL
      ELSE p.marketing_consent_at END,
    tags = coalesce(p_tags, p.tags),
    updated_at = now()
  RETURNING * INTO row_out;

  RETURN to_jsonb(row_out);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_upsert_profile(text, text, text, text, text, text, boolean, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_upsert_profile(text, text, text, text, text, text, boolean, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_set_level(
  p_email text, p_activity public.activity_type, p_level public.skill_level, p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE row_out public.crm_client_levels;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.crm_client_levels (email, activity, level, notes)
  VALUES (lower(trim(p_email)), p_activity, p_level, p_notes)
  ON CONFLICT (email, activity) DO UPDATE
    SET level = EXCLUDED.level, notes = EXCLUDED.notes, updated_at = now()
  RETURNING * INTO row_out;

  RETURN to_jsonb(row_out);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_set_level(text, public.activity_type, public.skill_level, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_set_level(text, public.activity_type, public.skill_level, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_add_document(
  p_email text, p_title text, p_url text, p_doc_type text DEFAULT 'autre'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE row_out public.crm_client_documents;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.crm_client_documents (email, title, url, doc_type, created_by)
  VALUES (lower(trim(p_email)), p_title, p_url, coalesce(p_doc_type, 'autre'), auth.uid())
  RETURNING * INTO row_out;

  RETURN to_jsonb(row_out);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_add_document(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_add_document(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_delete_document(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  DELETE FROM public.crm_client_documents WHERE id = p_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crm_delete_document(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_delete_document(uuid) TO authenticated;