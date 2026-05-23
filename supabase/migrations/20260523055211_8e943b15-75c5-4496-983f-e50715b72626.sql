DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;

CREATE POLICY "Anyone can create reservations"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);