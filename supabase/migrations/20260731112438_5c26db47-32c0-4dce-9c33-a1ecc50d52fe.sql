CREATE TABLE IF NOT EXISTS public.assistant_prepared_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  priority text NOT NULL DEFAULT 'normale',
  title text NOT NULL,
  justification text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'prepared',
  source text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  segment_definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  segment_summary text,
  recipients_count integer NOT NULL DEFAULT 0,
  recipients_preview jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  prepared_by uuid,
  prepared_by_email text,
  decided_by uuid,
  decided_by_email text,
  decided_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistant_prepared_actions_status_chk
    CHECK (status IN ('prepared', 'validated', 'cancelled', 'expired')),
  CONSTRAINT assistant_prepared_actions_type_chk
    CHECK (action_type IN ('campagne_brevo', 'relance_credits', 'relance_inactifs', 'campagne_meteo',
                           'promo_stage', 'derniere_minute', 'export_csv', 'rapport_pdf'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_prepared_actions TO authenticated;
GRANT ALL ON public.assistant_prepared_actions TO service_role;

ALTER TABLE public.assistant_prepared_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prepared actions"
  ON public.assistant_prepared_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS assistant_prepared_actions_status_idx
  ON public.assistant_prepared_actions (status, created_at DESC);

CREATE TRIGGER trg_assistant_prepared_actions_updated_at
  BEFORE UPDATE ON public.assistant_prepared_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Couche unique de préparation : calcule le segment, estime l'audience, enregistre un brouillon.
CREATE OR REPLACE FUNCTION public.assistant_prepare_action(p_action_type text, p_params jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_params jsonb := coalesce(p_params, '{}'::jsonb);
  v_content jsonb := coalesce(v_params->'content', '{}'::jsonb);
  v_seg jsonb;
  v_est jsonb;
  v_row public.assistant_prepared_actions;
  v_activity text := nullif(v_params->>'activity', '');
  v_days int := coalesce((v_params->>'days')::int, 30);
  v_title text;
  v_summary text;
  v_priority text := coalesce(nullif(v_params->>'priority',''), 'normale');
  v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  IF p_action_type NOT IN ('campagne_brevo','relance_credits','relance_inactifs','campagne_meteo',
                           'promo_stage','derniere_minute','export_csv','rapport_pdf') THEN
    RAISE EXCEPTION 'Type d''action inconnu : %', p_action_type;
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  -- Segment par défaut selon le type d'action (aucune logique métier côté frontend)
  v_seg := jsonb_build_object(
    'activities', CASE WHEN v_activity IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(v_activity) END,
    'topics', '[]'::jsonb,
    'consent', 'yes',
    'levels', '[]'::jsonb,
    'lifecycle', '[]'::jsonb,
    'credits', '[]'::jsonb,
    'departments', '[]'::jsonb,
    'countries', '[]'::jsonb
  );

  CASE p_action_type
    WHEN 'relance_credits' THEN
      v_seg := v_seg || jsonb_build_object('credits', jsonb_build_array('expiring_soon'));
      v_title := 'Relance crédits expirant sous ' || v_days || ' jours';
      v_summary := 'Clients consentants avec crédits bientôt expirés';
    WHEN 'relance_inactifs' THEN
      v_seg := v_seg || jsonb_build_object('lifecycle', jsonb_build_array('inactive'),
                                           'not_booked_since_months', coalesce((v_params->>'months')::int, 6));
      v_title := 'Relance clients inactifs';
      v_summary := 'Clients consentants sans réservation récente';
    WHEN 'campagne_meteo' THEN
      v_seg := v_seg || jsonb_build_object('topics', jsonb_build_array('weather'));
      v_title := 'Campagne météo' || coalesce(' — ' || v_activity, '');
      v_summary := 'Clients abonnés aux alertes météo';
    WHEN 'promo_stage' THEN
      v_seg := v_seg || jsonb_build_object('topics', jsonb_build_array('promotions'));
      v_title := 'Promotion Stage 100 % Glisse';
      v_summary := 'Clients consentants intéressés par les promotions';
    WHEN 'derniere_minute' THEN
      v_seg := v_seg || jsonb_build_object('topics', jsonb_build_array('promotions'),
                                           'max_distance_km', coalesce((v_params->>'max_distance_km')::numeric, 80));
      v_title := 'Campagne dernière minute' || coalesce(' — ' || (v_params->>'date'), '');
      v_summary := 'Clients de proximité consentants';
    WHEN 'export_csv' THEN
      v_title := 'Export CSV du segment';
      v_summary := 'Export lecture seule du segment sélectionné';
    WHEN 'rapport_pdf' THEN
      v_title := 'Rapport PDF';
      v_summary := 'Synthèse imprimable des indicateurs';
    ELSE
      v_title := coalesce(nullif(v_params->>'title',''), 'Campagne Brevo');
      v_summary := 'Segment marketing consentant';
  END CASE;

  IF v_params ? 'segment_definition' THEN
    v_seg := v_params->'segment_definition';
  END IF;

  IF nullif(v_params->>'title','') IS NOT NULL THEN
    v_title := v_params->>'title';
  END IF;

  -- Estimation d'audience (lecture seule) sauf pour le rapport PDF
  IF p_action_type = 'rapport_pdf' THEN
    v_est := jsonb_build_object('clients', 0, 'emails', 0, 'preview', '[]'::jsonb);
  ELSE
    v_est := public.marketing_segment_estimate(v_seg);
  END IF;

  INSERT INTO public.assistant_prepared_actions (
    action_type, priority, title, justification, status, source,
    payload, segment_definition, segment_summary, recipients_count, recipients_preview,
    prepared_by, prepared_by_email
  ) VALUES (
    p_action_type,
    v_priority,
    v_title,
    coalesce(nullif(v_params->>'justification',''), 'Préparé depuis le Cockpit IA'),
    'prepared',
    nullif(v_params->>'source',''),
    jsonb_build_object(
      'subject', coalesce(v_content->>'subject', v_title),
      'preheader', v_content->>'preheader',
      'text', v_content->>'text',
      'html', v_content->>'html',
      'cta_label', v_content->>'cta_label',
      'cta_url', v_content->>'cta_url',
      'activity', v_activity,
      'params', v_params - 'content'
    ),
    v_seg,
    v_summary,
    coalesce((v_est->>'emails')::int, (v_est->>'clients')::int, 0),
    coalesce(v_est->'preview', '[]'::jsonb),
    auth.uid(),
    v_email
  ) RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

-- Validation explicite : crée UNIQUEMENT un brouillon de campagne, aucun envoi.
CREATE OR REPLACE FUNCTION public.assistant_validate_action(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.assistant_prepared_actions;
  v_campaign_id uuid;
  v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  SELECT * INTO v_row FROM public.assistant_prepared_actions WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Action introuvable'; END IF;
  IF v_row.status <> 'prepared' THEN RAISE EXCEPTION 'Action déjà traitée (%).', v_row.status; END IF;
  IF v_row.expires_at < now() THEN
    UPDATE public.assistant_prepared_actions SET status = 'expired' WHERE id = p_id;
    RAISE EXCEPTION 'Action expirée, préparez-la à nouveau.';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  IF v_row.action_type IN ('campagne_brevo','relance_credits','relance_inactifs','campagne_meteo','promo_stage','derniere_minute') THEN
    INSERT INTO public.marketing_campaigns (
      name, subject, preheader, content_html, cta_label, cta_url, status,
      audience, recipients_count, created_by, created_by_email
    ) VALUES (
      v_row.title,
      coalesce(v_row.payload->>'subject', v_row.title),
      v_row.payload->>'preheader',
      coalesce(v_row.payload->>'html', '<p>' || coalesce(v_row.payload->>'text', '') || '</p>'),
      v_row.payload->>'cta_label',
      v_row.payload->>'cta_url',
      'draft',
      v_row.segment_definition,
      v_row.recipients_count,
      auth.uid(),
      v_email
    ) RETURNING id INTO v_campaign_id;
  END IF;

  UPDATE public.assistant_prepared_actions
     SET status = 'validated',
         decided_by = auth.uid(),
         decided_by_email = v_email,
         decided_at = now(),
         result = jsonb_build_object('campaign_id', v_campaign_id, 'sent', false,
                                     'message', 'Brouillon créé — aucun email envoyé')
   WHERE id = p_id
   RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.assistant_cancel_action(p_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.assistant_prepared_actions;
  v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();

  UPDATE public.assistant_prepared_actions
     SET status = 'cancelled', decided_by = auth.uid(), decided_by_email = v_email,
         decided_at = now(), result = jsonb_build_object('reason', p_reason)
   WHERE id = p_id AND status = 'prepared'
   RETURNING * INTO v_row;

  IF NOT FOUND THEN RAISE EXCEPTION 'Action introuvable ou déjà traitée'; END IF;
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.assistant_list_actions(p_status text DEFAULT NULL, p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acces refuse : reserve aux administrateurs';
  END IF;

  UPDATE public.assistant_prepared_actions
     SET status = 'expired'
   WHERE status = 'prepared' AND expires_at < now();

  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_items
  FROM (
    SELECT * FROM public.assistant_prepared_actions
    WHERE p_status IS NULL OR status = p_status
    ORDER BY created_at DESC
    LIMIT least(coalesce(p_limit, 50), 200)
  ) t;

  RETURN jsonb_build_object(
    'items', v_items,
    'compteurs', jsonb_build_object(
      'prepared', (SELECT count(*) FROM public.assistant_prepared_actions WHERE status = 'prepared'),
      'validated', (SELECT count(*) FROM public.assistant_prepared_actions WHERE status = 'validated'),
      'cancelled', (SELECT count(*) FROM public.assistant_prepared_actions WHERE status = 'cancelled'),
      'expired', (SELECT count(*) FROM public.assistant_prepared_actions WHERE status = 'expired')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assistant_prepare_action(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assistant_validate_action(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assistant_cancel_action(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assistant_list_actions(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assistant_prepare_action(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_validate_action(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_cancel_action(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_list_actions(text, integer) TO authenticated;