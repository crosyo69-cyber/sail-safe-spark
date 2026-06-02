
-- Analytics events table for tracking the visitor → lead funnel
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view','phone_click','form_submit')),
  page_path text,
  location text,
  metadata jsonb
);

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events (session_id);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (anon visitors included) can insert events
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read analytics events
CREATE POLICY "Admins can read analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
