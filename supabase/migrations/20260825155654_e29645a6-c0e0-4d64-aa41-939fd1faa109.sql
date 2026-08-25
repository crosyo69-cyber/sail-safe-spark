CREATE INDEX IF NOT EXISTS idx_caa_code_recent
  ON public.code_access_attempts USING btree (code_hash, created_at DESC)
  WHERE (result = 'invalid_code');

CREATE OR REPLACE FUNCTION public.code_access_guard(p_code text, p_context text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ip text;
  v_ip_hash text;
  v_code_hash text;
  v_distinct int;
  v_total int;
  v_code_fails int;
BEGIN
  -- ré-entrance : une seule garde par transaction (RPC imbriquées)
  IF coalesce(current_setting('kp.code_guard', true), '') <> '' THEN
    RETURN current_setting('kp.code_guard', true) = 'ok';
  END IF;

  v_ip := public.code_access_client_ip();
  IF v_ip IS NULL THEN
    -- appel interne (cron, edge function service_role, SQL direct) : ni garde ni journal
    PERFORM set_config('kp.code_guard', 'internal', true);
    RETURN true;
  END IF;

  v_ip_hash := public.code_access_hash('ip:' || v_ip);
  v_code_hash := public.code_access_hash('code:' || upper(btrim(coalesce(p_code,''))));

  -- sérialisation par IP puis par code (ordre fixe : pas de deadlock)
  PERFORM pg_advisory_xact_lock(hashtext('code_access:' || v_ip_hash));
  PERFORM pg_advisory_xact_lock(hashtext('code_access_code:' || v_code_hash));

  -- axe 1 (inchangé) : par IP, 10 codes distincts OU 60 échecs / 10 minutes
  SELECT count(DISTINCT code_hash), count(*)
    INTO v_distinct, v_total
    FROM public.code_access_attempts
   WHERE ip_hash = v_ip_hash
     AND result <> 'success'
     AND created_at > now() - interval '10 minutes';

  -- axe 2 (nouveau) : par code_hash, 30 échecs de validation / 1 heure, toutes IP confondues
  SELECT count(*)
    INTO v_code_fails
    FROM public.code_access_attempts
   WHERE code_hash = v_code_hash
     AND result = 'invalid_code'
     AND created_at > now() - interval '1 hour';

  IF v_distinct >= 10 OR v_total >= 60 OR v_code_fails >= 30 THEN
    INSERT INTO public.code_access_attempts(code_hash, ip_hash, context, result)
    VALUES (v_code_hash, v_ip_hash, p_context, 'rate_limited');
    PERFORM set_config('kp.code_guard', 'blocked', true);
    RETURN false;
  END IF;

  PERFORM set_config('kp.code_guard', 'ok', true);
  PERFORM set_config('kp.code_guard_ip', v_ip_hash, true);
  RETURN true;
END;
$function$;