CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  preheader text,
  content_html text NOT NULL DEFAULT '',
  hero_image_url text,
  cta_label text,
  cta_url text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipients_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_by_email text,
  updated_by uuid,
  updated_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_campaigns_status_check CHECK (status IN ('draft','ready','scheduled','sent','archived'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view campaigns" ON public.marketing_campaigns
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create campaigns" ON public.marketing_campaigns
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update campaigns" ON public.marketing_campaigns
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete campaigns" ON public.marketing_campaigns
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_created_at ON public.marketing_campaigns(created_at DESC);

CREATE OR REPLACE FUNCTION public.marketing_estimate_audience(p_audience jsonb)
RETURNS TABLE(recipients integer, emails text[])
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activities text[];
  v_lifecycle text[];
  v_with_credits boolean := COALESCE((p_audience->>'with_credits')::boolean, false);
  v_expiring boolean := COALESCE((p_audience->>'expiring_30d')::boolean, false);
  v_optin boolean := COALESCE((p_audience->>'marketing_consent_only')::boolean, false);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT COALESCE(array_agg(x), '{}') INTO v_activities
  FROM jsonb_array_elements_text(COALESCE(p_audience->'activities', '[]'::jsonb)) x;

  SELECT COALESCE(array_agg(x), '{}') INTO v_lifecycle
  FROM jsonb_array_elements_text(COALESCE(p_audience->'lifecycle', '[]'::jsonb)) x;

  RETURN QUERY
  WITH base AS (
    SELECT * FROM public.crm_client_base()
  ), filtered AS (
    SELECT b.email
    FROM base b
    WHERE (cardinality(v_activities) = 0 OR b.activities && v_activities)
      AND (cardinality(v_lifecycle) = 0 OR b.lifecycle = ANY(v_lifecycle))
      AND (NOT v_with_credits OR b.credits_remaining > 0)
      AND (NOT v_expiring OR (b.next_expiry IS NOT NULL AND b.next_expiry <= now() + interval '30 days' AND b.credits_remaining > 0))
      AND (NOT v_optin OR b.marketing_consent = true)
      AND b.email IS NOT NULL
      AND b.email NOT IN (SELECT s.email FROM public.suppressed_emails s)
  )
  SELECT COUNT(*)::integer, COALESCE(array_agg(f.email), '{}') FROM filtered f;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.marketing_estimate_audience(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marketing_estimate_audience(jsonb) TO authenticated;