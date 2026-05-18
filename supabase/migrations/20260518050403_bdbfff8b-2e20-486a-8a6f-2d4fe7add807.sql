CREATE OR REPLACE FUNCTION public.validate_client_package_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_type text := lower(coalesce(NEW.package_type, ''));
  v_allowed int[];
BEGIN
  IF NEW.total_sessions IS NULL OR NEW.total_sessions < 1 THEN
    RAISE EXCEPTION 'total_sessions must be >= 1';
  END IF;

  IF v_type LIKE '%carte%' THEN
    v_allowed := ARRAY[1,3,5,10];
  ELSIF v_type LIKE '%wingfoil%' THEN
    v_allowed := ARRAY[1,3,5];
  ELSIF v_type LIKE '%stage 100%' OR v_type LIKE '%100%glisse%' THEN
    v_allowed := ARRAY[5];
  ELSE
    -- per-participant activities: 1..6
    v_allowed := ARRAY[1,2,3,4,5,6];
  END IF;

  IF NOT (NEW.total_sessions = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid total_sessions % for package_type "%": allowed values are %',
      NEW.total_sessions, NEW.package_type, v_allowed;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_client_package_sessions ON public.client_packages;
CREATE TRIGGER trg_validate_client_package_sessions
BEFORE INSERT OR UPDATE OF total_sessions, package_type ON public.client_packages
FOR EACH ROW EXECUTE FUNCTION public.validate_client_package_sessions();