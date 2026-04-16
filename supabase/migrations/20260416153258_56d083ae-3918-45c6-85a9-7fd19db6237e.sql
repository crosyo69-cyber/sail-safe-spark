CREATE POLICY "Service role can delete old 404 logs"
ON public.page_404_logs
FOR DELETE
TO service_role
USING (true);