-- ROLLBACK LOT C-2.2-B — restaure code_access_guard() sans l'axe code_hash.
-- NE PAS APPLIQUER sauf incident. Autonome, aucune donnée métier à restaurer.
-- Définition ci-dessous = pg_get_functiondef() capturé AVANT la migration C-2.2-B.

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

  -- sérialisation par IP : le compteur ne peut pas être contourné par concurrence
  PERFORM pg_advisory_xact_lock(hashtext('code_access:' || v_ip_hash));

  SELECT count(DISTINCT code_hash), count(*)
    INTO v_distinct, v_total
    FROM public.code_access_attempts
   WHERE ip_hash = v_ip_hash
     AND result <> 'success'
     AND created_at > now() - interval '10 minutes';

  IF v_distinct >= 10 OR v_total >= 60 THEN
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

-- Optionnel (index ajouté par C-2.2-B, sans impact fonctionnel s'il est conservé) :
-- DROP INDEX IF EXISTS public.idx_caa_code_recent;
