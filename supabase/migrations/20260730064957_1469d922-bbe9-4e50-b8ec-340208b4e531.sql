CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  brevo_list_id integer,
  mode text NOT NULL DEFAULT 'test' CHECK (mode IN ('test','production')),
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.marketing_settings TO authenticated;
GRANT ALL ON public.marketing_settings TO service_role;
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing settings"
ON public.marketing_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marketing_settings_updated_at
BEFORE UPDATE ON public.marketing_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.marketing_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.marketing_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer NOT NULL DEFAULT 0,
  performed_by uuid,
  performed_by_email text,
  mode text NOT NULL DEFAULT 'test',
  total_candidates integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketing_sync_logs TO authenticated;
GRANT ALL ON public.marketing_sync_logs TO service_role;
ALTER TABLE public.marketing_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read marketing sync logs"
ON public.marketing_sync_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_marketing_sync_logs_created_at
ON public.marketing_sync_logs (created_at DESC);