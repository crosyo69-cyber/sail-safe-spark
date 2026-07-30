CREATE TABLE public.credit_reminder_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE REFERENCES public.client_packages(id) ON DELETE CASCADE,
  remind_30 boolean NOT NULL DEFAULT true,
  remind_7 boolean NOT NULL DEFAULT true,
  remind_0 boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.credit_reminder_preferences TO service_role;
GRANT SELECT ON public.credit_reminder_preferences TO authenticated;

ALTER TABLE public.credit_reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder prefs"
  ON public.credit_reminder_preferences FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access reminder prefs"
  ON public.credit_reminder_preferences FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_credit_reminder_prefs_updated_at
  BEFORE UPDATE ON public.credit_reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_credit_reminders(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'remind_30', COALESCE(p.remind_30, true),
    'remind_7',  COALESCE(p.remind_7, true),
    'remind_0',  COALESCE(p.remind_0, true)
  )
  FROM public.client_packages cp
  LEFT JOIN public.credit_reminder_preferences p ON p.package_id = cp.id
  WHERE cp.package_code = p_code
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_credit_reminders(
  p_code text, p_remind_30 boolean, p_remind_7 boolean, p_remind_0 boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  SELECT id INTO v_pkg FROM public.client_packages WHERE package_code = p_code;
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  INSERT INTO public.credit_reminder_preferences (package_id, remind_30, remind_7, remind_0)
  VALUES (v_pkg, COALESCE(p_remind_30, true), COALESCE(p_remind_7, true), COALESCE(p_remind_0, true))
  ON CONFLICT (package_id) DO UPDATE
    SET remind_30 = EXCLUDED.remind_30,
        remind_7  = EXCLUDED.remind_7,
        remind_0  = EXCLUDED.remind_0,
        updated_at = now();

  RETURN jsonb_build_object('ok', true,
    'remind_30', COALESCE(p_remind_30, true),
    'remind_7',  COALESCE(p_remind_7, true),
    'remind_0',  COALESCE(p_remind_0, true));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_credit_reminders(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_credit_reminders(text, boolean, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_credit_reminders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_credit_reminders(text, boolean, boolean, boolean) TO anon, authenticated;