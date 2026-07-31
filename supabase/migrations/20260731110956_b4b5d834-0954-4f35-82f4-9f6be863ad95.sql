CREATE OR REPLACE FUNCTION public.assistant_briefing()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deposit numeric := 50;
  v_today date := current_date;
  v_month_start date := date_trunc('month', v_today)::date;
  v_year_start date := date_trunc('year', v_today)::date;
  v_activite jsonb;
  v_business jsonb;
  v_alertes jsonb := '[]'::jsonb;
  v_opportunites jsonb := '[]'::jsonb;
  v_crm jsonb;
  v_marketing jsonb;
  v_questions jsonb := '[]'::jsonb;
  v_places_demain int := 0;
  v_credits_30 int := 0;
  v_inactifs int := 0;
  v_top_activite text;
  v_low_day jsonb;
  v_stage_places int := 0;
  v_n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  -- ---------- Activité du jour ----------
  WITH occ AS (
    SELECT g.id, g.date, g.activity::text AS activity, g.max_participants, g.status,
           coalesce((SELECT sum(r.participants) FROM public.reservations r
                     WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
         + coalesce((SELECT count(*) FROM public.package_bookings pb
                     WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
    FROM public.daily_groups g
    WHERE g.date = v_today
  )
  SELECT jsonb_build_object(
    'date', v_today,
    'reservations', (SELECT count(*) FROM public.reservations r
                     JOIN public.daily_groups g ON g.id = r.daily_group_id
                     WHERE r.status = 'confirmed' AND g.date = v_today),
    'participants', coalesce((SELECT sum(o.total) FROM occ o), 0),
    'par_activite', coalesce((SELECT jsonb_object_agg(o.activity, s) FROM (
        SELECT activity, sum(total) AS s FROM occ GROUP BY activity) o), '{}'::jsonb),
    'groupes', (SELECT count(*) FROM occ),
    'places_restantes', coalesce((SELECT sum(greatest(o.max_participants - o.total, 0)) FROM occ o), 0),
    'journees_completes', (SELECT count(*) FROM occ o WHERE o.total >= o.max_participants),
    'capacite_totale', coalesce((SELECT sum(o.max_participants) FROM occ o), 0),
    'taux_remplissage_pct', (SELECT CASE WHEN coalesce(sum(o.max_participants), 0) > 0
        THEN round(100.0 * sum(o.total) / sum(o.max_participants), 1) ELSE 0 END FROM occ o)
  ) INTO v_activite;

  -- ---------- Business ----------
  WITH res AS (
    SELECT r.participants, g.activity::text AS activity, r.created_at::date AS d
    FROM public.reservations r
    LEFT JOIN public.daily_groups g ON g.id = r.daily_group_id
    WHERE r.status = 'confirmed' AND r.stripe_session_id IS NOT NULL
  )
  SELECT jsonb_build_object(
    'acomptes_jour_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res WHERE d = v_today),
    'transactions_jour', (SELECT count(*) FROM res WHERE d = v_today),
    'ca_mois_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res WHERE d BETWEEN v_month_start AND v_today),
    'ca_saison_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res WHERE d BETWEEN v_year_start AND v_today),
    'panier_moyen_eur', (SELECT CASE WHEN count(*) > 0 THEN round(sum(participants) * v_deposit / count(*), 2) ELSE 0 END
                          FROM res WHERE d BETWEEN v_month_start AND v_today),
    'ca_mois_n1_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res
                        WHERE d BETWEEN (v_month_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
    'ca_saison_n1_eur', (SELECT coalesce(sum(participants), 0) * v_deposit FROM res
                        WHERE d BETWEEN (v_year_start - interval '1 year')::date AND (v_today - interval '1 year')::date),
    'par_activite_mois', (SELECT coalesce(jsonb_object_agg(coalesce(activity, 'inconnue'), ca), '{}'::jsonb)
        FROM (SELECT activity, sum(participants) * v_deposit AS ca FROM res
              WHERE d BETWEEN v_month_start AND v_today GROUP BY activity) t),
    'activite_plus_rentable', (SELECT coalesce(activity, 'inconnue') FROM res
        WHERE d BETWEEN v_month_start AND v_today
        GROUP BY activity ORDER BY sum(participants) DESC NULLS LAST LIMIT 1),
    'packs_vendus_mois', (SELECT count(*) FROM public.client_packages cp
        WHERE cp.created_at::date BETWEEN v_month_start AND v_today AND cp.status <> 'cancelled'),
    'acomptes_packs_mois_eur', (SELECT coalesce(sum(cp.deposit_amount), 0) FROM public.client_packages cp
        WHERE cp.deposit_paid_at::date BETWEEN v_month_start AND v_today)
  ) INTO v_business;

  v_business := v_business || jsonb_build_object(
    'evolution_mois_pct',
      CASE WHEN (v_business->>'ca_mois_n1_eur')::numeric > 0
        THEN round(100.0 * ((v_business->>'ca_mois_eur')::numeric - (v_business->>'ca_mois_n1_eur')::numeric)
                   / (v_business->>'ca_mois_n1_eur')::numeric, 1)
        ELSE NULL END,
    'evolution_saison_pct',
      CASE WHEN (v_business->>'ca_saison_n1_eur')::numeric > 0
        THEN round(100.0 * ((v_business->>'ca_saison_eur')::numeric - (v_business->>'ca_saison_n1_eur')::numeric)
                   / (v_business->>'ca_saison_n1_eur')::numeric, 1)
        ELSE NULL END
  );

  v_top_activite := v_business->>'activite_plus_rentable';

  -- ---------- Alertes ----------
  SELECT count(*) INTO v_credits_30 FROM public.session_credits sc
    WHERE sc.status = 'available' AND sc.expires_at <= now() + interval '30 days';
  IF v_credits_30 > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'credits_expirants', 'severite', 'warning',
      'titre', v_credits_30 || ' crédit(s) expirent sous 30 jours',
      'detail', 'Relancer les clients concernés avant expiration.',
      'nombre', v_credits_30);
  END IF;

  SELECT count(*) INTO v_n FROM public.client_packages cp
    WHERE cp.status = 'active' AND cp.used_sessions = 0
      AND cp.created_at < now() - interval '30 days';
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'packs_inutilises', 'severite', 'warning',
      'titre', v_n || ' pack(s) jamais utilisé(s) depuis plus de 30 jours',
      'detail', 'Ces clients ont payé mais n''ont jamais réservé.', 'nombre', v_n);
  END IF;

  SELECT count(*) INTO v_inactifs FROM public.marketing_segment_base() b
    WHERE NOT b.is_test AND NOT b.suppressed AND b.lifecycle = 'inactive';
  IF v_inactifs > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'clients_inactifs', 'severite', 'info',
      'titre', v_inactifs || ' client(s) inactif(s)',
      'detail', 'Aucune venue depuis plus de 12 mois.', 'nombre', v_inactifs);
  END IF;

  SELECT count(*) INTO v_n FROM public.reservations r
    WHERE r.status = 'confirmed' AND r.daily_group_id IS NULL;
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'reservations_incompletes', 'severite', 'critical',
      'titre', v_n || ' réservation(s) sans journée affectée',
      'detail', 'À rattacher manuellement à un groupe.', 'nombre', v_n);
  END IF;

  SELECT count(*) INTO v_n FROM public.reservations r
    WHERE r.status = 'pending' AND r.created_at < now() - interval '2 hours'
      AND r.created_at > now() - interval '30 days';
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'paiements_en_attente', 'severite', 'warning',
      'titre', v_n || ' paiement(s) en attente depuis plus de 2 h',
      'detail', 'Checkout Stripe non finalisé ou webhook manquant.', 'nombre', v_n);
  END IF;

  SELECT count(*) INTO v_n FROM public.client_packages cp
    WHERE cp.stripe_session_id IS NOT NULL AND cp.deposit_paid_at IS NULL
      AND cp.created_at > now() - interval '30 days';
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'stripe_incoherent', 'severite', 'critical',
      'titre', v_n || ' pack(s) Stripe sans acompte enregistré',
      'detail', 'Vérifier la synchronisation Stripe des 30 derniers jours.', 'nombre', v_n);
  END IF;

  SELECT count(*) INTO v_n FROM public.marketing_automation_runs ar
    WHERE ar.status = 'error' AND ar.started_at > now() - interval '7 days';
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'automatisations_echec', 'severite', 'critical',
      'titre', v_n || ' automatisation(s) en échec sur 7 jours',
      'detail', 'Consulter l''historique des automatisations.', 'nombre', v_n);
  END IF;

  SELECT count(*) INTO v_n FROM public.email_send_log l
    WHERE l.status <> 'sent' AND l.created_at > now() - interval '7 days';
  IF v_n > 0 THEN
    v_alertes := v_alertes || jsonb_build_object(
      'code', 'emails_echec', 'severite', 'warning',
      'titre', v_n || ' email(s) en erreur sur 7 jours',
      'detail', 'Campagnes ou notifications non délivrées.', 'nombre', v_n);
  END IF;

  -- ---------- Opportunités ----------
  SELECT coalesce(sum(greatest(g.max_participants - occ.total, 0)), 0) INTO v_places_demain
  FROM public.daily_groups g
  CROSS JOIN LATERAL (
    SELECT coalesce((SELECT sum(r.participants) FROM public.reservations r
                     WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
         + coalesce((SELECT count(*) FROM public.package_bookings pb
                     WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
  ) occ
  WHERE g.date = v_today + 1 AND g.status <> 'cancelled';

  IF v_places_demain > 0 THEN
    v_opportunites := v_opportunites || jsonb_build_object(
      'id', 'remplissage_demain', 'type', 'campagne_last_minute',
      'titre', 'Remplir les ' || v_places_demain || ' place(s) de demain',
      'pourquoi', 'Il reste ' || v_places_demain || ' place(s) disponible(s) demain : une offre last-minute aux abonnés convertit rapidement.',
      'prompt', 'Prépare une campagne last-minute pour remplir les places de demain.',
      'action', jsonb_build_object('kind', 'campaign', 'segment', 'last_minute', 'date', v_today + 1),
      'statut', 'suggestion');
  END IF;

  IF v_credits_30 > 0 THEN
    v_opportunites := v_opportunites || jsonb_build_object(
      'id', 'credits_expirants', 'type', 'relance_credits',
      'titre', 'Relancer les crédits expirant sous 30 jours',
      'pourquoi', v_credits_30 || ' crédit(s) vont expirer : une relance évite la perte de valeur client et remplit les journées creuses.',
      'prompt', 'Quels clients dois-je relancer pour leurs crédits qui expirent ?',
      'action', jsonb_build_object('kind', 'campaign', 'segment', 'credits_expiring', 'days', 30),
      'statut', 'suggestion');
  END IF;

  IF v_inactifs > 0 THEN
    v_opportunites := v_opportunites || jsonb_build_object(
      'id', 'relance_fidelite', 'type', 'relance_fidelite',
      'titre', 'Campagne fidélité vers ' || v_inactifs || ' client(s) inactif(s)',
      'pourquoi', 'Réactiver un ancien client coûte moins cher qu''en acquérir un nouveau.',
      'prompt', 'Prépare une relance fidélité pour les clients inactifs.',
      'action', jsonb_build_object('kind', 'campaign', 'segment', 'inactive'),
      'statut', 'suggestion');
  END IF;

  SELECT jsonb_build_object('date', g.date, 'activite', g.activity::text,
           'places', greatest(g.max_participants - occ.total, 0))
  INTO v_low_day
  FROM public.daily_groups g
  CROSS JOIN LATERAL (
    SELECT coalesce((SELECT sum(r.participants) FROM public.reservations r
                     WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
         + coalesce((SELECT count(*) FROM public.package_bookings pb
                     WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
  ) occ
  WHERE g.date BETWEEN v_today + 2 AND v_today + 14 AND g.status <> 'cancelled'
    AND occ.total < g.max_participants
  ORDER BY occ.total ASC, g.date ASC
  LIMIT 1;

  IF v_low_day IS NOT NULL THEN
    v_opportunites := v_opportunites || jsonb_build_object(
      'id', 'journee_creuse', 'type', 'remplissage_journee',
      'titre', 'Journée peu réservée le ' || to_char((v_low_day->>'date')::date, 'DD/MM'),
      'pourquoi', 'Il reste ' || (v_low_day->>'places') || ' place(s) en ' || (v_low_day->>'activite') ||
                  ' : cibler les clients proches (moins de 50 km) maximise le remplissage.',
      'prompt', 'Prépare une campagne pour remplir la journée du ' || to_char((v_low_day->>'date')::date, 'DD/MM') || '.',
      'action', jsonb_build_object('kind', 'campaign', 'segment', 'proximity', 'date', v_low_day->>'date'),
      'statut', 'suggestion');
  END IF;

  IF v_top_activite IS NOT NULL AND v_top_activite <> 'wingfoil' THEN
    SELECT count(*) INTO v_n FROM public.marketing_segment_base() b
      WHERE NOT b.is_test AND NOT b.suppressed AND b.consent AND 'wingfoil' = ANY(b.activities);
    IF v_n > 0 THEN
      v_opportunites := v_opportunites || jsonb_build_object(
        'id', 'campagne_wingfoil', 'type', 'campagne_activite',
        'titre', 'Campagne Wingfoil vers ' || v_n || ' contact(s)',
        'pourquoi', 'Le Wingfoil est sous-représenté ce mois-ci (activité dominante : ' || v_top_activite ||
                    ') alors que ' || v_n || ' contact(s) consentant(s) sont intéressés.',
        'prompt', 'Prépare une campagne Wingfoil.',
        'action', jsonb_build_object('kind', 'campaign', 'segment', 'activity', 'activity', 'wingfoil'),
        'statut', 'suggestion');
    END IF;
  END IF;

  SELECT coalesce(sum(greatest(g.max_participants - occ.total, 0)), 0) INTO v_stage_places
  FROM public.daily_groups g
  CROSS JOIN LATERAL (
    SELECT coalesce((SELECT sum(r.participants) FROM public.reservations r
                     WHERE r.daily_group_id = g.id AND r.status = 'confirmed'), 0)
         + coalesce((SELECT count(*) FROM public.package_bookings pb
                     WHERE pb.daily_group_id = g.id AND pb.status <> 'cancelled'), 0) AS total
  ) occ
  WHERE g.activity = 'stage_100_glisse' AND g.date BETWEEN v_today AND v_today + 30
    AND g.status <> 'cancelled';

  IF v_stage_places >= 4 THEN
    v_opportunites := v_opportunites || jsonb_build_object(
      'id', 'promo_stage', 'type', 'promotion',
      'titre', 'Promotion Stage 100% Glisse',
      'pourquoi', v_stage_places || ' place(s) de Stage restent libres sur 30 jours : une offre packagée augmente le panier moyen.',
      'prompt', 'Prépare une promotion pour le Stage 100% Glisse.',
      'action', jsonb_build_object('kind', 'campaign', 'segment', 'activity', 'activity', 'stage_100_glisse'),
      'statut', 'suggestion');
  END IF;

  -- ---------- CRM ----------
  SELECT jsonb_build_object(
    'nouveaux_30j', count(*) FILTER (WHERE b.first_date >= v_today - 30),
    'clients_total', count(*),
    'actifs', count(*) FILTER (WHERE b.lifecycle = 'active'),
    'inactifs', count(*) FILTER (WHERE b.lifecycle = 'inactive'),
    'prospects', count(*) FILTER (WHERE b.lifecycle = 'prospect'),
    'sans_reservation_6m', count(*) FILTER (WHERE b.last_date IS NOT NULL AND b.last_date < v_today - 180),
    'top_clients', coalesce((SELECT jsonb_agg(c) FROM (
        SELECT jsonb_build_object(
          'nom', nullif(trim(coalesce(t.first_name, '') || ' ' || coalesce(t.last_name, '')), ''),
          'email', t.email, 'ca_eur', t.revenue, 'reservations', t.reservations_count,
          'credits_restants', t.credits_remaining, 'derniere_venue', t.last_date) AS c
        FROM public.marketing_segment_base() t
        WHERE NOT t.is_test
        ORDER BY t.revenue DESC NULLS LAST LIMIT 5) x), '[]'::jsonb),
    'a_relancer', coalesce((SELECT jsonb_agg(c) FROM (
        SELECT jsonb_build_object(
          'nom', nullif(trim(coalesce(t.first_name, '') || ' ' || coalesce(t.last_name, '')), ''),
          'email', t.email, 'credits_restants', t.credits_remaining,
          'prochaine_expiration', t.next_expiry, 'derniere_venue', t.last_date,
          'consentement', t.consent,
          'raison', CASE
            WHEN t.credits_remaining > 0 AND t.next_expiry IS NOT NULL
                 AND t.next_expiry <= now() + interval '30 days' THEN 'crédits bientôt expirés'
            WHEN t.lifecycle = 'inactive' THEN 'inactif depuis plus d''un an'
            ELSE 'sans venue depuis 6 mois' END) AS c
        FROM public.marketing_segment_base() t
        WHERE NOT t.is_test AND NOT t.suppressed
          AND ((t.credits_remaining > 0 AND t.next_expiry IS NOT NULL AND t.next_expiry <= now() + interval '30 days')
               OR t.lifecycle = 'inactive'
               OR (t.last_date IS NOT NULL AND t.last_date < v_today - 180))
        ORDER BY t.next_expiry NULLS LAST LIMIT 8) x), '[]'::jsonb)
  ) INTO v_crm
  FROM public.marketing_segment_base() b
  WHERE NOT b.is_test;

  -- ---------- Marketing ----------
  SELECT jsonb_build_object(
    'campagnes_actives', (SELECT count(*) FROM public.marketing_campaigns mc
        WHERE mc.status IN ('scheduled', 'sending')),
    'campagnes_recentes', coalesce((SELECT jsonb_agg(c) FROM (
        SELECT jsonb_build_object('nom', mc.name, 'statut', mc.status,
          'destinataires', mc.recipients_count, 'planifiee_le', mc.scheduled_at) AS c
        FROM public.marketing_campaigns mc ORDER BY mc.created_at DESC LIMIT 5) x), '[]'::jsonb),
    'campagnes_en_echec_30j', (SELECT count(*) FROM public.marketing_campaigns mc
        WHERE mc.status = 'error' AND mc.updated_at > now() - interval '30 days'),
    'automatisations_actives', (SELECT count(*) FROM public.marketing_automations a WHERE a.active),
    'automatisations_executees_7j', (SELECT count(*) FROM public.marketing_automation_runs ar
        WHERE ar.started_at > now() - interval '7 days'),
    'prochaine_automatisation', (SELECT jsonb_build_object('nom', a.name, 'le', a.next_run_at)
        FROM public.marketing_automations a WHERE a.active ORDER BY a.next_run_at ASC LIMIT 1),
    'base_marketing', (SELECT count(*) FROM public.marketing_segment_base() b WHERE NOT b.is_test),
    'contacts_consentants', (SELECT count(*) FROM public.marketing_segment_base() b
        WHERE b.consent AND NOT b.is_test AND NOT b.suppressed),
    'emails_envoyes_30j', (SELECT count(*) FROM public.email_send_log l
        WHERE l.created_at >= now() - interval '30 days' AND l.status = 'sent')
  ) INTO v_marketing;

  -- ---------- Questions suggérées contextuelles ----------
  IF v_places_demain > 0 THEN
    v_questions := v_questions || to_jsonb('Prépare une campagne pour remplir les places de demain.'::text);
  END IF;
  IF v_credits_30 > 0 THEN
    v_questions := v_questions || to_jsonb('Quels clients dois-je relancer pour leurs crédits qui expirent ?'::text);
  END IF;
  IF jsonb_array_length(v_alertes) > 0 THEN
    v_questions := v_questions || to_jsonb('Détaille les alertes du jour et leur impact.'::text);
  END IF;
  IF v_inactifs > 0 THEN
    v_questions := v_questions || to_jsonb('Liste les clients inactifs à réactiver en priorité.'::text);
  END IF;
  v_questions := v_questions
    || to_jsonb('Quel est le CA du mois comparé à l''an dernier ?'::text)
    || to_jsonb('Quelle activité fonctionne le mieux cette saison ?'::text)
    || to_jsonb('Quelles journées sont complètes cette semaine ?'::text);

  RETURN jsonb_build_object(
    'genere_le', now(),
    'date', v_today,
    'activite_du_jour', coalesce(v_activite, '{}'::jsonb),
    'business', coalesce(v_business, '{}'::jsonb),
    'alertes', v_alertes,
    'opportunites', v_opportunites,
    'crm', coalesce(v_crm, '{}'::jsonb),
    'marketing', coalesce(v_marketing, '{}'::jsonb),
    'meteo', jsonb_build_object('connectee', false, 'message', 'Météo non connectée'),
    'questions_suggerees', v_questions
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.assistant_briefing() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assistant_briefing() TO authenticated;