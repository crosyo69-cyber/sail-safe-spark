-- 1) Restrict the public SELECT on sessions to non-sensitive columns only.
REVOKE SELECT ON public.sessions FROM anon, authenticated;
GRANT SELECT (
  id, date, time_slot, activity, max_participants, status,
  weather_condition, weather_note, last_minute_label,
  is_last_minute, published_at, created_at, updated_at
) ON public.sessions TO anon, authenticated;
-- Admins / edge functions retain full access
GRANT ALL ON public.sessions TO service_role;

-- 2) Scrub the `notes` column from Realtime broadcasts.
ALTER PUBLICATION supabase_realtime DROP TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions (
  id, date, time_slot, activity, max_participants, status,
  weather_condition, weather_note, last_minute_label,
  is_last_minute, published_at, created_at, updated_at
);

-- 3) Default-deny on realtime.messages so unscoped topic subscriptions are blocked.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users subscribe to own topic" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe to own topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('user:' || auth.uid()::text)
  );