CREATE TABLE public.marketing_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  consent_source text,
  activities text[] NOT NULL DEFAULT '{}',
  topics text[] NOT NULL DEFAULT '{}',
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketing_preferences TO authenticated;
GRANT ALL ON public.marketing_preferences TO service_role;

ALTER TABLE public.marketing_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage marketing preferences"
ON public.marketing_preferences FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_marketing_preferences_updated_at
BEFORE UPDATE ON public.marketing_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync du consentement vers la fiche CRM
CREATE OR REPLACE FUNCTION public.sync_marketing_consent_to_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.crm_client_profiles
  SET marketing_consent = NEW.consent,
      marketing_consent_at = CASE WHEN NEW.consent THEN coalesce(NEW.consent_at, now()) ELSE NULL END,
      marketing_consent_source = coalesce(NEW.consent_source, 'PREFERENCE_CENTER'),
      updated_at = now()
  WHERE lower(email) = lower(NEW.email);

  IF NOT FOUND THEN
    INSERT INTO public.crm_client_profiles (email, marketing_consent, marketing_consent_at, marketing_consent_source)
    VALUES (lower(NEW.email), NEW.consent,
            CASE WHEN NEW.consent THEN coalesce(NEW.consent_at, now()) ELSE NULL END,
            coalesce(NEW.consent_source, 'PREFERENCE_CENTER'));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_marketing_consent
AFTER INSERT OR UPDATE OF consent, consent_at, consent_source ON public.marketing_preferences
FOR EACH ROW EXECUTE FUNCTION public.sync_marketing_consent_to_crm();

-- Résolution email depuis un code de pack ou un jeton
CREATE OR REPLACE FUNCTION public.resolve_marketing_email(p_code text, p_token uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(e) FROM (
    SELECT (SELECT cp.email FROM public.client_packages cp
            WHERE p_code IS NOT NULL AND upper(cp.package_code) = upper(p_code)
            ORDER BY cp.created_at DESC LIMIT 1) AS e
    UNION ALL
    SELECT (SELECT mp.email FROM public.marketing_preferences mp WHERE p_token IS NOT NULL AND mp.token = p_token)
  ) t WHERE e IS NOT NULL LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_preferences(p_code text DEFAULT NULL, p_token uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v jsonb;
BEGIN
  v_email := public.resolve_marketing_email(p_code, p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('found', false); END IF;

  SELECT jsonb_build_object(
    'found', true,
    'email', v_email,
    'consent', coalesce(mp.consent, false),
    'activities', to_jsonb(coalesce(mp.activities, '{}')),
    'topics', to_jsonb(coalesce(mp.topics, '{}')),
    'token', mp.token,
    'first_name', pr.first_name,
    'updated_at', mp.updated_at
  ) INTO v
  FROM (SELECT 1) x
  LEFT JOIN public.marketing_preferences mp ON lower(mp.email) = v_email
  LEFT JOIN public.crm_client_profiles pr ON lower(pr.email) = v_email;

  RETURN coalesce(v, jsonb_build_object('found', true, 'email', v_email, 'consent', false,
                                        'activities', '[]'::jsonb, 'topics', '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.save_marketing_preferences(
  p_consent boolean,
  p_activities text[] DEFAULT '{}',
  p_topics text[] DEFAULT '{}',
  p_code text DEFAULT NULL,
  p_token uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text; v_token uuid;
BEGIN
  v_email := public.resolve_marketing_email(p_code, p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;

  INSERT INTO public.marketing_preferences (email, consent, consent_at, consent_source, activities, topics)
  VALUES (v_email, coalesce(p_consent, false),
          CASE WHEN p_consent THEN now() ELSE NULL END,
          'PREFERENCE_CENTER',
          coalesce(p_activities, '{}'), coalesce(p_topics, '{}'))
  ON CONFLICT (email) DO UPDATE
    SET consent = EXCLUDED.consent,
        consent_at = CASE WHEN EXCLUDED.consent THEN coalesce(public.marketing_preferences.consent_at, now()) ELSE NULL END,
        consent_source = 'PREFERENCE_CENTER',
        activities = EXCLUDED.activities,
        topics = EXCLUDED.topics,
        updated_at = now()
  RETURNING token INTO v_token;

  RETURN jsonb_build_object('success', true, 'email', v_email, 'token', v_token);
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_marketing_email(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_preferences(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_marketing_preferences(boolean, text[], text[], text, uuid) TO anon, authenticated;