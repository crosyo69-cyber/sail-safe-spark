-- Journal des conversations de l'assistant IA (admin)
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  question text NOT NULL,
  answer text,
  intents jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.assistant_conversations TO authenticated;
GRANT ALL ON public.assistant_conversations TO service_role;

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read assistant conversations" ON public.assistant_conversations;
CREATE POLICY "Admins read assistant conversations"
ON public.assistant_conversations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins log assistant conversations" ON public.assistant_conversations;
CREATE POLICY "Admins log assistant conversations"
ON public.assistant_conversations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created ON public.assistant_conversations (created_at DESC);

-- Couche de lecture unique de l'assistant : aucune ecriture possible
CREATE OR REPLACE FUNCTION public.assistant_query(p_intent text, p_params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_start date;
  v_end date;
  v_period text := coalesce(p_params->>'period', 'month');
  v_activity text := nullif(p_params->>'activity', '');
  v_days int := coalesce((p_params->>'days')::int, 30);
  v_limit int := least(coalesce((p_params->>'limit')::int, 10), 50);
  v_deposit numeric := 50;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  SELECT CASE v_period
    WHEN 'today' THEN current_date
    WHEN 'tomorrow' THEN current_date + 1
    WHEN 'week' THEN date_trunc('week', current_date)::date
    WHEN 'month' THEN date_trunc('month', current_date)::date
    WHEN 'year' THEN date_trunc('year', current_date)::date
    WHEN 'all' THEN date '2020-01-01'
    ELSE date_trunc('month', current_date)::date
  END INTO v_start;

  SELECT CASE v_period
    WHEN 'today' THEN current_date
    WHEN 'tomorrow' THEN current_date + 1
    WHEN 'week' THEN (date_trunc('week', current_date) + interval '6 days')::date
    WHEN 'month' THEN (date_trunc('month', current_date) + interval '1 month - 1 day')::date
    WHEN 'year' THEN (date_trunc('year', current_date) + interval '1 year - 1 day')::date
    WHEN 'all' THEN current_date + 365
    ELSE (date_trunc('month', current_date) + interval '1 month - 1 day')::date
  END INTO v_end;

  IF p_params->>'start' IS NOT NULL THEN v_start := (p_params->>'start')::date; END IF;
  IF p_params->>'end' IS NOT NULL THEN v_end := (p_params->>'end')::date; END IF;

  CASE p_intent

  WHEN 'reservations' THEN
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end, 'libelle', v_period),
      'total_reservations', count(*),
      'total_participants', coalesce(sum(r.participants), 0),
      'par_activite', coalesce((SELECT jsonb_object_agg(a, n) FROM (
          SELECT g2.activity::text AS a, count(*) AS n
          FROM public.reservations r2
          JOIN public.daily_groups g2 ON g2.id = r2.daily_group_id
          WHERE r2.status = 'confirmed' AND g2.date BETWEEN v_start AND v_end
            AND (v_activity IS NULL OR g2.activity::text = v_activity)
          GROUP BY g2.activity) t), '{}'::jsonb)
    ) INTO v_result
    FROM public.reservations r
    JOIN public.daily_groups g ON g.id = r.daily_group_id
    WHERE r.status = 'confirmed'
      AND g.date BETWEEN v_start AND v_end
      AND (v_activity IS NULL OR g.activity::text = v_activity);

  WHEN 'reservations_detail' THEN
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end),
      'journees', coalesce(jsonb_agg(d ORDER BY d->>'date'), '[]'::jsonb)
    ) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'date', g.date,
        'activite', g.activity::text,
        'groupe', g.group_index,
        'statut', g.status,
        'capacite', g.max_participants,
        'inscrits', coalesce((SELECT sum(r.participants) FROM public.reservations r
                              WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
                    + coalesce((SELECT count(*) FROM public.package_bookings pb
                              WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0)
      ) AS d
      FROM public.daily_groups g
      WHERE g.date BETWEEN v_start AND v_end
        AND (v_activity IS NULL OR g.activity::text = v_activity)
    ) s;

  WHEN 'journees_completes' THEN
    SELECT jsonb_build_object('journees', coalesce(jsonb_agg(d ORDER BY d->>'date'), '[]'::jsonb)) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'date', g.date, 'activite', g.activity::text, 'groupe', g.group_index,
        'capacite', g.max_participants, 'inscrits', occ.total,
        'complet', occ.total >= g.max_participants,
        'places_restantes', greatest(g.max_participants - occ.total, 0),
        'statut', g.status
      ) AS d
      FROM public.daily_groups g
      CROSS JOIN LATERAL (
        SELECT coalesce((SELECT sum(r.participants) FROM public.reservations r
                          WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
             + coalesce((SELECT count(*) FROM public.package_bookings pb
                          WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
      ) occ
      WHERE g.date BETWEEN current_date AND current_date + v_days
        AND (v_activity IS NULL OR g.activity::text = v_activity)
    ) s;

  WHEN 'business' THEN
    WITH res AS (
      SELECT r.participants, g.activity::text AS activity
      FROM public.reservations r
      LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
      WHERE r.status = 'confirmed' AND r.stripe_session_id IS NOT NULL
        AND r.created_at::date BETWEEN v_start AND v_end
    )
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end),
      'transactions', (SELECT count(*) FROM res),
      'participants', (SELECT coalesce(sum(participants), 0) FROM res),
      'chiffre_affaires_acomptes_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res),
      'panier_moyen_eur', (SELECT CASE WHEN count(*) > 0
            THEN round(sum(participants) * v_deposit / count(*), 2) ELSE 0 END FROM res),
      'par_activite', (SELECT coalesce(jsonb_object_agg(coalesce(activity, 'inconnue'), ca), '{}'::jsonb)
                        FROM (SELECT activity, sum(participants) * v_deposit AS ca FROM res GROUP BY activity) t),
      'packs_vendus', (SELECT count(*) FROM public.client_packages cp
                        WHERE cp.created_at::date BETWEEN v_start AND v_end),
      'acomptes_packs_eur', (SELECT coalesce(sum(cp.deposit_amount), 0) FROM public.client_packages cp
                        WHERE cp.deposit_paid_at::date BETWEEN v_start AND v_end)
    ) INTO v_result;

  WHEN 'remplissage' THEN
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end),
      'groupes', count(*),
      'capacite_totale', coalesce(sum(g.max_participants), 0),
      'places_occupees', coalesce(sum(occ.total), 0),
      'taux_remplissage_pct', CASE WHEN coalesce(sum(g.max_participants), 0) > 0
          THEN round(100.0 * sum(occ.total) / sum(g.max_participants), 1) ELSE 0 END
    ) INTO v_result
    FROM public.daily_groups g
    CROSS JOIN LATERAL (
      SELECT coalesce((SELECT sum(r.participants) FROM public.reservations r
                        WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
           + coalesce((SELECT count(*) FROM public.package_bookings pb
                        WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
    ) occ
    WHERE g.date BETWEEN v_start AND v_end
      AND (v_activity IS NULL OR g.activity::text = v_activity);

  WHEN 'crm_stats' THEN
    SELECT jsonb_build_object(
      'clients_total', count(*),
      'nouveaux_30j', count(*) FILTER (WHERE b.lifecycle = 'nouveau'),
      'actifs_12m', count(*) FILTER (WHERE b.lifecycle = 'active'),
      'inactifs', count(*) FILTER (WHERE b.lifecycle = 'inactive'),
      'prospects', count(*) FILTER (WHERE b.lifecycle = 'prospect'),
      'consentement_marketing', count(*) FILTER (WHERE b.consent),
      'credits_restants_total', coalesce(sum(b.credits_remaining), 0),
      'ca_cumule_eur', coalesce(sum(b.revenue), 0)
    ) INTO v_result
    FROM public.marketing_segment_base() b
    WHERE NOT b.is_test;

  WHEN 'top_clients' THEN
    SELECT jsonb_build_object('clients', coalesce(jsonb_agg(c ORDER BY (c->>'ca_eur')::numeric DESC), '[]'::jsonb))
    INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'nom', trim(coalesce(b.first_name, '') || ' ' || coalesce(b.last_name, '')),
        'email', b.email,
        'ca_eur', b.revenue,
        'reservations', b.reservations_count,
        'packs', b.packages_count,
        'credits_restants', b.credits_remaining,
        'derniere_venue', b.last_date
      ) AS c
      FROM public.marketing_segment_base() b
      WHERE NOT b.is_test
      ORDER BY b.revenue DESC NULLS LAST
      LIMIT v_limit
    ) s;

  WHEN 'clients_a_relancer' THEN
    SELECT jsonb_build_object('clients', coalesce(jsonb_agg(c), '[]'::jsonb)) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'nom', trim(coalesce(b.first_name, '') || ' ' || coalesce(b.last_name, '')),
        'email', b.email,
        'credits_restants', b.credits_remaining,
        'prochaine_expiration', b.next_expiry,
        'derniere_venue', b.last_date,
        'cycle_de_vie', b.lifecycle,
        'consentement', b.consent,
        'raison', CASE
          WHEN b.credits_remaining > 0 AND b.next_expiry IS NOT NULL
               AND b.next_expiry <= now() + make_interval(days => v_days) THEN 'credits bientot expires'
          WHEN b.lifecycle = 'inactive' THEN 'inactif depuis plus d un an'
          ELSE 'credits non consommes' END
      ) AS c
      FROM public.marketing_segment_base() b
      WHERE NOT b.is_test AND NOT b.suppressed
        AND (
          (b.credits_remaining > 0 AND b.next_expiry IS NOT NULL
            AND b.next_expiry <= now() + make_interval(days => v_days))
          OR b.lifecycle = 'inactive'
        )
      ORDER BY b.next_expiry NULLS LAST
      LIMIT v_limit
    ) s;

  WHEN 'credits' THEN
    SELECT jsonb_build_object(
      'disponibles', count(*) FILTER (WHERE sc.status = 'available'),
      'consommes', count(*) FILTER (WHERE sc.status = 'consumed'),
      'expires', count(*) FILTER (WHERE sc.status = 'expired'),
      'expirent_dans_x_jours', jsonb_build_object(
        'jours', v_days,
        'nombre', count(*) FILTER (WHERE sc.status = 'available'
          AND sc.expires_at <= now() + make_interval(days => v_days))
      ),
      'par_activite', coalesce((SELECT jsonb_object_agg(a, n) FROM (
          SELECT s2.activity::text AS a, count(*) AS n FROM public.session_credits s2
          WHERE s2.status = 'available' GROUP BY s2.activity) t), '{}'::jsonb),
      'recredits_periode', (SELECT count(*) FROM public.session_credits s3
          WHERE s3.origin = 'recredit' AND s3.created_at::date BETWEEN v_start AND v_end)
    ) INTO v_result
    FROM public.session_credits sc;

  WHEN 'credits_expirant' THEN
    SELECT jsonb_build_object('credits', coalesce(jsonb_agg(c ORDER BY c->>'expire_le'), '[]'::jsonb)) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'email', cp.email,
        'nom', trim(coalesce(cp.first_name, '') || ' ' || coalesce(cp.last_name, '')),
        'activite', sc.activity::text,
        'credits', count(*),
        'expire_le', min(sc.expires_at)
      ) AS c
      FROM public.session_credits sc
      JOIN public.client_packages cp ON cp.id = sc.package_id
      WHERE sc.status = 'available'
        AND sc.expires_at <= now() + make_interval(days => v_days)
      GROUP BY cp.email, cp.first_name, cp.last_name, sc.activity
      ORDER BY min(sc.expires_at)
      LIMIT v_limit
    ) s;

  WHEN 'packs' THEN
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end),
      'packs', coalesce(jsonb_agg(p ORDER BY p->>'cree_le' DESC), '[]'::jsonb)
    ) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'code', cp.package_code, 'email', cp.email,
        'activite', cp.activity::text, 'type', cp.package_type,
        'seances', cp.total_sessions, 'utilisees', cp.used_sessions,
        'statut', cp.status, 'acompte_eur', cp.deposit_amount,
        'expire_le', cp.expires_at, 'cree_le', cp.created_at
      ) AS p
      FROM public.client_packages cp
      WHERE cp.created_at::date BETWEEN v_start AND v_end
      ORDER BY cp.created_at DESC
      LIMIT v_limit
    ) s;

  WHEN 'marketing' THEN
    SELECT jsonb_build_object(
      'campagnes', coalesce((SELECT jsonb_agg(c) FROM (
        SELECT jsonb_build_object('nom', mc.name, 'objet', mc.subject, 'statut', mc.status,
          'destinataires', mc.recipients_count, 'planifiee_le', mc.scheduled_at, 'creee_le', mc.created_at) AS c
        FROM public.marketing_campaigns mc ORDER BY mc.created_at DESC LIMIT v_limit) t), '[]'::jsonb),
      'segments', coalesce((SELECT jsonb_agg(jsonb_build_object('nom', ms.name, 'description', ms.description))
        FROM public.marketing_segments ms), '[]'::jsonb),
      'contacts_consentants', (SELECT count(*) FROM public.marketing_segment_base() b
        WHERE b.consent AND NOT b.is_test AND NOT b.suppressed),
      'emails_envoyes_30j', (SELECT count(*) FROM public.email_send_log l
        WHERE l.created_at >= now() - interval '30 days' AND l.status = 'sent'),
      'emails_en_erreur_30j', (SELECT count(*) FROM public.email_send_log l
        WHERE l.created_at >= now() - interval '30 days' AND l.status <> 'sent')
    ) INTO v_result;

  WHEN 'automatisations' THEN
    SELECT jsonb_build_object(
      'automatisations', coalesce((SELECT jsonb_agg(jsonb_build_object(
          'nom', a.name, 'active', a.active, 'declencheur', a.trigger_type,
          'derniere_execution', a.last_run_at, 'prochaine_execution', a.next_run_at,
          'priorite', a.priority)) FROM public.marketing_automations a), '[]'::jsonb),
      'derniers_runs', coalesce((SELECT jsonb_agg(r) FROM (
          SELECT jsonb_build_object('mode', ar.mode, 'statut', ar.status,
            'destinataires', ar.recipients_count, 'ignores', ar.skipped_count,
            'lance_le', ar.started_at) AS r
          FROM public.marketing_automation_runs ar ORDER BY ar.started_at DESC LIMIT v_limit) t), '[]'::jsonb)
    ) INTO v_result;

  WHEN 'meilleure_activite' THEN
    SELECT jsonb_build_object(
      'periode', jsonb_build_object('debut', v_start, 'fin', v_end),
      'activites', coalesce(jsonb_agg(a ORDER BY (a->>'ca_eur')::numeric DESC), '[]'::jsonb)
    ) INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'activite', g.activity::text,
        'participants', coalesce(sum(r.participants), 0),
        'reservations', count(r.id),
        'ca_eur', coalesce(sum(r.participants), 0) * v_deposit
      ) AS a
      FROM public.daily_groups g
      LEFT JOIN public.reservations r ON r.daily_group_id = g.id AND r.status = 'confirmed'
      WHERE g.date BETWEEN v_start AND v_end
      GROUP BY g.activity
    ) s;

  WHEN 'liste_attente' THEN
    SELECT jsonb_build_object('en_attente', coalesce(jsonb_agg(w), '[]'::jsonb)) INTO v_result
    FROM (
      SELECT jsonb_build_object('date', dw.date, 'activite', dw.activity::text,
        'participants', dw.participants, 'statut', dw.status, 'inscrit_le', dw.created_at) AS w
      FROM public.daily_waitlist dw
      WHERE dw.status <> 'cancelled' AND dw.date >= current_date
      ORDER BY dw.date LIMIT v_limit
    ) s;

  ELSE
    RAISE EXCEPTION 'Intention inconnue: %', p_intent;
  END CASE;

  RETURN coalesce(v_result, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_query(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assistant_query(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.assistant_query(text, jsonb) TO authenticated;