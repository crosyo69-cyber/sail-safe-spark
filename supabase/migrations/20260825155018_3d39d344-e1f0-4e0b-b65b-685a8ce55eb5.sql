CREATE OR REPLACE FUNCTION public.get_credit_reminders(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_res jsonb;
BEGIN
  IF NOT public.code_access_guard(p_code, 'get_credit_reminders') THEN
    RETURN jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true);
  END IF;

  SELECT jsonb_build_object(
    'remind_30', COALESCE(p.remind_30, true),
    'remind_7',  COALESCE(p.remind_7, true),
    'remind_0',  COALESCE(p.remind_0, true)
  )
  INTO v_res
  FROM public.client_packages cp
  LEFT JOIN public.credit_reminder_preferences p ON p.package_id = cp.id
  WHERE cp.package_code = p_code
  LIMIT 1;

  PERFORM public.code_access_record(p_code, 'get_credit_reminders', v_res IS NOT NULL);

  RETURN COALESCE(v_res, jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true));
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_credit_reminders(p_code text, p_remind_30 boolean, p_remind_7 boolean, p_remind_0 boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_pkg uuid;
BEGIN
  IF NOT public.code_access_guard(p_code, 'set_credit_reminders') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT id INTO v_pkg FROM public.client_packages WHERE package_code = p_code;

  PERFORM public.code_access_record(p_code, 'set_credit_reminders', v_pkg IS NOT NULL);

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
$function$;