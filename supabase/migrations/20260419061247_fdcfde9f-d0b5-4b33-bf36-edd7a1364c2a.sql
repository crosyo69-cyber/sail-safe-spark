CREATE POLICY "Admins can read 404 logs"
ON public.page_404_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));