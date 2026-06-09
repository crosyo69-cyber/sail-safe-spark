
CREATE OR REPLACE FUNCTION public.validate_client_package_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_type text := lower(coalesce(NEW.package_type, ''));
  v_activity text := NEW.activity::text;
  v_allowed int[];
BEGIN
  IF NEW.total_sessions IS NULL OR NEW.total_sessions < 1 THEN
    RAISE EXCEPTION 'total_sessions must be >= 1';
  END IF;

  -- Only enforce canonical pack sizes on initial creation.
  -- Admin recredit / debit may legitimately push total_sessions outside the canonical set.
  IF TG_OP <> 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF v_activity = 'stage_100_glisse' THEN
    v_allowed := ARRAY[5];
  ELSIF v_type LIKE '%carte%' THEN
    v_allowed := ARRAY[1,3,5,10];
  ELSIF v_type LIKE '%wingfoil%' THEN
    v_allowed := ARRAY[1,3,5];
  ELSIF v_type LIKE '%stage 100%' OR v_type LIKE '%100%glisse%' THEN
    v_allowed := ARRAY[5];
  ELSE
    v_allowed := ARRAY[1,2,3,4,5,6];
  END IF;

  IF NOT (NEW.total_sessions = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid total_sessions % for package_type "%": allowed values are %',
      NEW.total_sessions, NEW.package_type, v_allowed;
  END IF;

  RETURN NEW;
END;
$function$;
