-- Grille tarifaire de référence (lecture seule, utilisée pour valoriser les prestations)
CREATE OR REPLACE FUNCTION public.unit_price_eur(p_activity text, p_package_type text, p_date date DEFAULT current_date)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_package_type ILIKE '%stage%' AND p_activity = 'stage_100_glisse'
      THEN CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 99.80 ELSE 79.80 END
    WHEN p_activity = 'stage_100_glisse'
      THEN CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 99.80 ELSE 79.80 END
    WHEN p_package_type ILIKE '%location%' THEN 30
    WHEN p_package_type ILIKE '%dépose%' OR p_package_type ILIKE '%depose%' THEN 45
    WHEN p_package_type ILIKE '%particulier%'
      THEN CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 380 ELSE 230 END
    WHEN p_activity = 'wingfoil'
      THEN CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 110 ELSE 90 END
    WHEN p_activity = 'pumpfoil' THEN 50
    WHEN p_activity = 'foil_tracte' THEN 50
    WHEN p_activity = 'kitesurf'
      THEN CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 130 ELSE 120 END
    ELSE CASE WHEN extract(month FROM p_date) BETWEEN 4 AND 9 THEN 130 ELSE 120 END
  END::numeric
$$;

CREATE OR REPLACE FUNCTION public.assistant_financial_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := current_date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_season_start date := date_trunc('year', v_today)::date;
  v_deposit numeric := 50;
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  WITH
  -- 1) Acomptes encaissés (Stripe) : packs + réservations visiteurs
  acomptes AS (
    SELECT cp.id::text AS ref, 'pack'::text AS source, cp.activity::text AS activite,
           cp.deposit_paid_at::date AS d,
           trim(coalesce(cp.first_name,'') || ' ' || coalesce(cp.last_name,'')) AS client,
           cp.email, coalesce(cp.deposit_amount, 0) AS montant, cp.status
    FROM public.client_packages cp
    WHERE cp.deposit_paid_at IS NOT NULL AND cp.status <> 'cancelled'
    UNION ALL
    SELECT r.id::text, 'reservation', coalesce(g.activity::text, 'inconnue'),
           r.created_at::date,
           trim(r.first_name || ' ' || r.last_name), r.email,
           r.participants * v_deposit, r.status::text
    FROM public.reservations r
    LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
    WHERE r.status = 'confirmed' AND r.stripe_session_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.client_packages cp2 WHERE cp2.stripe_session_id = r.stripe_session_id)
  ),
  -- 2) Valeur des prestations réservées (tarifs catalogue, hors acomptes)
  prestations AS (
    SELECT cp.id::text AS ref, 'pack'::text AS source, cp.activity::text AS activite,
           cp.created_at::date AS d,
           trim(coalesce(cp.first_name,'') || ' ' || coalesce(cp.last_name,'')) AS client,
           cp.email,
           cp.total_sessions * public.unit_price_eur(cp.activity::text, cp.package_type, cp.created_at::date) AS montant,
           cp.status
    FROM public.client_packages cp
    WHERE cp.status <> 'cancelled'
    UNION ALL
    SELECT r.id::text, 'reservation', coalesce(g.activity::text, 'inconnue'),
           coalesce(g.date, r.created_at::date),
           trim(r.first_name || ' ' || r.last_name), r.email,
           r.participants * public.unit_price_eur(coalesce(g.activity::text,'kitesurf'), 'collectif', coalesce(g.date, r.created_at::date)),
           r.status::text
    FROM public.reservations r
    LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
    WHERE r.status = 'confirmed'
      AND NOT EXISTS (SELECT 1 FROM public.client_packages cp2 WHERE cp2.stripe_session_id = r.stripe_session_id AND r.stripe_session_id IS NOT NULL)
  ),
  -- 3) Crédits FIFO disponibles valorisés
  credits AS (
    SELECT sc.id, sc.activity::text AS activite, sc.expires_at,
           trim(coalesce(cp.first_name,'') || ' ' || coalesce(cp.last_name,'')) AS client,
           cp.email,
           public.unit_price_eur(sc.activity::text, cp.package_type, sc.created_at::date) AS valeur
    FROM public.session_credits sc
    JOIN public.client_packages cp ON cp.id = sc.package_id
    WHERE sc.status = 'available' AND sc.expires_at > now()
  ),
  solde AS (
    SELECT p.email,
           sum(p.montant) AS presta,
           coalesce((SELECT sum(a.montant) FROM acomptes a WHERE a.email = p.email), 0) AS acompte
    FROM prestations p GROUP BY p.email
  )
  SELECT jsonb_build_object(
    'genere_le', now(),
    'date', v_today,
    'tarifs_source', 'Grille tarifaire officielle (haute saison avril-septembre / basse saison octobre-mars)',
    'acomptes', jsonb_build_object(
      'jour_eur', (SELECT coalesce(sum(montant),0) FROM acomptes WHERE d = v_today),
      'mois_eur', (SELECT coalesce(sum(montant),0) FROM acomptes WHERE d BETWEEN v_month_start AND v_today),
      'saison_eur', (SELECT coalesce(sum(montant),0) FROM acomptes WHERE d BETWEEN v_season_start AND v_today),
      'saison_n1_eur', (SELECT coalesce(sum(montant),0) FROM acomptes
                        WHERE d BETWEEN (v_season_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
      'mois_n1_eur', (SELECT coalesce(sum(montant),0) FROM acomptes
                        WHERE d BETWEEN (v_month_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
      'transactions_mois', (SELECT count(*) FROM acomptes WHERE d BETWEEN v_month_start AND v_today)
    ),
    'prestations', jsonb_build_object(
      'jour_eur', (SELECT coalesce(sum(montant),0) FROM prestations WHERE d = v_today),
      'mois_eur', (SELECT coalesce(sum(montant),0) FROM prestations WHERE d BETWEEN v_month_start AND v_today),
      'saison_eur', (SELECT coalesce(sum(montant),0) FROM prestations WHERE d BETWEEN v_season_start AND v_today),
      'saison_n1_eur', (SELECT coalesce(sum(montant),0) FROM prestations
                        WHERE d BETWEEN (v_season_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
      'mois_n1_eur', (SELECT coalesce(sum(montant),0) FROM prestations
                        WHERE d BETWEEN (v_month_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
      'par_activite_saison', (SELECT coalesce(jsonb_object_agg(activite, s), '{}'::jsonb) FROM (
          SELECT activite, sum(montant) AS s FROM prestations
          WHERE d BETWEEN v_season_start AND v_today GROUP BY activite) t)
    ),
    'solde_restant', jsonb_build_object(
      'total_eur', (SELECT coalesce(sum(greatest(presta - acompte, 0)), 0) FROM solde),
      'clients_concernes', (SELECT count(*) FROM solde WHERE presta - acompte > 0)
    ),
    'credits', jsonb_build_object(
      'nombre', (SELECT count(*) FROM credits),
      'valeur_eur', (SELECT coalesce(sum(valeur),0) FROM credits),
      'valeur_expirant_30j_eur', (SELECT coalesce(sum(valeur),0) FROM credits WHERE expires_at <= now() + interval '30 days'),
      'nombre_expirant_30j', (SELECT count(*) FROM credits WHERE expires_at <= now() + interval '30 days')
    ),
    'repartition', jsonb_build_object(
      'acomptes_eur', (SELECT coalesce(sum(montant),0) FROM acomptes WHERE d BETWEEN v_season_start AND v_today),
      'prestations_eur', (SELECT coalesce(sum(montant),0) FROM prestations WHERE d BETWEEN v_season_start AND v_today),
      'credits_eur', (SELECT coalesce(sum(valeur),0) FROM credits)
    ),
    'details', jsonb_build_object(
      'acomptes', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'date' DESC), '[]'::jsonb) FROM (
          SELECT jsonb_build_object('activite', activite, 'date', d, 'client', nullif(client,''), 'email', email,
                                    'montant_eur', montant, 'statut', status, 'source', source) AS x, d
          FROM acomptes ORDER BY d DESC LIMIT 100) a),
      'prestations', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'date' DESC), '[]'::jsonb) FROM (
          SELECT jsonb_build_object('activite', activite, 'date', d, 'client', nullif(client,''), 'email', email,
                                    'montant_eur', montant, 'statut', status, 'source', source) AS x, d
          FROM prestations ORDER BY d DESC LIMIT 100) p),
      'solde', (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'montant_eur')::numeric DESC), '[]'::jsonb) FROM (
          SELECT jsonb_build_object('client', s.email, 'email', s.email,
                                    'montant_eur', round(s.presta - s.acompte, 2),
                                    'prestations_eur', round(s.presta,2), 'acomptes_eur', round(s.acompte,2),
                                    'statut', 'a_encaisser') AS x
          FROM solde s WHERE s.presta - s.acompte > 0 ORDER BY (s.presta - s.acompte) DESC LIMIT 100) q),
      'credits', (SELECT coalesce(jsonb_agg(x ORDER BY x->>'date'), '[]'::jsonb) FROM (
          SELECT jsonb_build_object('activite', c.activite, 'date', c.expires_at::date, 'client', nullif(c.client,''),
                                    'email', c.email, 'montant_eur', c.valeur,
                                    'statut', CASE WHEN c.expires_at <= now() + interval '30 days' THEN 'expire_bientot' ELSE 'disponible' END) AS x
          FROM credits c ORDER BY c.expires_at LIMIT 100) r)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_financial_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assistant_financial_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.unit_price_eur(text, text, date) TO authenticated, service_role;