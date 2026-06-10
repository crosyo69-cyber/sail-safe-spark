
-- 1. Defensive service_role policy on package_credit_history
CREATE POLICY "Service role full access"
  ON public.package_credit_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Tighten reservations INSERT policy
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
CREATE POLICY "Anyone can create reservations"
  ON public.reservations
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (user_id = auth.uid())
  );
