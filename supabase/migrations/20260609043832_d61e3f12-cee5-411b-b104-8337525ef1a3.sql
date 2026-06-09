DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Restrict realtime.messages: deny anon subscriptions explicitly
DROP POLICY IF EXISTS "Deny anon realtime access" ON realtime.messages;
CREATE POLICY "Deny anon realtime access"
  ON realtime.messages
  FOR SELECT
  TO anon
  USING (false);