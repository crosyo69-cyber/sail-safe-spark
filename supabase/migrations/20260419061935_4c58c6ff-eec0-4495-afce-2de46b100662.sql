CREATE POLICY "Admins can delete 404 logs"
ON public.page_404_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));