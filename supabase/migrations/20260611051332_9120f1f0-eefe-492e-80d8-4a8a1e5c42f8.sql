
-- 1) Blog comments moderation
ALTER TABLE public.blog_comments
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.blog_comments;

CREATE POLICY "Approved comments are viewable by everyone"
  ON public.blog_comments
  FOR SELECT
  USING (
    is_approved = true
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can moderate comments"
  ON public.blog_comments
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comments"
  ON public.blog_comments
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Restrict Realtime publication for public.sessions to non-sensitive columns
ALTER PUBLICATION supabase_realtime DROP TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions
  (id, date, time_slot, activity, max_participants, status,
   weather_condition, created_at, updated_at,
   is_last_minute, last_minute_label, published_at, stage_group_id);

-- Also revoke anon column-level access to sensitive fields (defense in depth for the Data API)
REVOKE SELECT (notes, weather_note, cancellation_reason) ON public.sessions FROM anon;
