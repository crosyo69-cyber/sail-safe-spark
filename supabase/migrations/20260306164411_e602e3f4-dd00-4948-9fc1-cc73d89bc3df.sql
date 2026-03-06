
CREATE TABLE public.page_404_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anonymous inserts (no auth required for logging 404s)
ALTER TABLE public.page_404_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts on page_404_logs"
  ON public.page_404_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Index for querying by path and date
CREATE INDEX idx_404_logs_path ON public.page_404_logs (path);
CREATE INDEX idx_404_logs_created_at ON public.page_404_logs (created_at DESC);
