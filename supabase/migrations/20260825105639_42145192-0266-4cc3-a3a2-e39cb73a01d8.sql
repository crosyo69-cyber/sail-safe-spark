-- ============================================================
-- LOT C-2 PHASE 1 : journalisation + anti-énumération + réponses uniformes
-- ============================================================

-- 1A. Secret (pepper) pour le hachage non réversible -----------------
CREATE TABLE IF NOT EXISTS public.code_access_secret (
  id           integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pepper       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.code_access_secret FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.code_access_secret TO service_role;
ALTER TABLE public.code_access_secret ENABLE ROW LEVEL SECURITY;
-- aucune policy : table verrouillée, lisible uniquement par les fonctions SECURITY DEFINER

INSERT INTO public.code_access_secret(id, pepper)
VALUES (1, encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (id) DO NOTHING;

-- 1A. Table de journalisation ---------------------------------------
CREATE TABLE IF NOT EXISTS public.code_access_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  code_hash   text NOT NULL,
  ip_hash     text NOT NULL,
  context     text NOT NULL,
  result      text NOT NULL CHECK (result IN ('invalid_code','rate_limited','success'))
);

REVOKE ALL ON public.code_access_attempts FROM PUBLIC, anon;
GRANT SELECT ON public.code_access_attempts TO authenticated; -- lecture filtrée par RLS (admin uniquement)
GRANT ALL ON public.code_access_attempts TO service_role;
ALTER TABLE public.code_access_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read code access attempts" ON public.code_access_attempts;
CREATE POLICY "Admins can read code access attempts"
  ON public.code_access_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- index strictement nécessaires
CREATE INDEX IF NOT EXISTS idx_caa_ip_recent
  ON public.code_access_attempts (ip_hash, created_at DESC)
  WHERE result <> 'success';
CREATE INDEX IF NOT EXISTS idx_caa_created_at
  ON public.code_access_attempts (created_at DESC);

-- 1A. Hachage non réversible ----------------------------------------
CREATE OR REPLACE FUNCTION public.code_access_hash(p_value text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT encode(
    extensions.digest(
      (SELECT pepper FROM public.code_access_secret WHERE id = 1) || '|' || coalesce(p_value,''),
      'sha256'
    ), 'hex');
$$;
REVOKE ALL ON FUNCTION public.code_access_hash(text) FROM PUBLIC, anon, authenticated;

-- Adresse appelante (via PostgREST) ; NULL = appel interne (SQL direct / service)
CREATE OR REPLACE FUNCTION public.code_access_client_ip()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_hdrs json; v_ip text;
BEGIN
  BEGIN
    v_hdrs := current_setting('request.headers', true)::json;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
  IF v_hdrs IS NULL THEN RETURN NULL; END IF;
  v_ip := split_part(coalesce(v_hdrs->>'x-forwarded-for', ''), ',', 1);
  v_ip := nullif(btrim(v_ip), '');
  IF v_ip IS NULL THEN
    v_ip := nullif(btrim(coalesce(v_hdrs->>'cf-connecting-ip','')), '');
  END IF;
  RETURN v_ip;
END;
$$;
REVOKE ALL ON FUNCTION public.code_access_client_ip() FROM PUBLIC, anon, authenticated;

-- 1B/1F. Garde anti-énumération (atomique par IP) --------------------
-- Retourne TRUE si l'appel est autorisé, FALSE si rate-limité.
-- Politique : sur 10 minutes glissantes, par IP :
--   - >= 10 codes DISTINCTS en échec  -> blocage (cible le balayage)
--   - >= 60 échecs bruts              -> blocage (cible le martèlement)
-- Les succès ne sont jamais comptés. Un même code rejoué ne consomme pas de quota.
CREATE OR REPLACE FUNCTION public.code_access_guard(p_code text, p_context text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;
REVOKE ALL ON FUNCTION public.code_access_guard(text, text) FROM PUBLIC, anon, authenticated;

-- Journalisation du résultat (une seule entrée par transaction) -------
CREATE OR REPLACE FUNCTION public.code_access_record(p_code text, p_context text, p_ok boolean)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ip_hash text;
BEGIN
  IF coalesce(current_setting('kp.code_guard', true), '') <> 'ok' THEN
    RETURN; -- appel interne, déjà bloqué, ou garde imbriquée déjà journalisée
  END IF;
  v_ip_hash := current_setting('kp.code_guard_ip', true);
  IF v_ip_hash IS NULL OR v_ip_hash = '' THEN RETURN; END IF;

  INSERT INTO public.code_access_attempts(code_hash, ip_hash, context, result)
  VALUES (
    public.code_access_hash('code:' || upper(btrim(coalesce(p_code,'')))),
    v_ip_hash,
    p_context,
    CASE WHEN p_ok THEN 'success' ELSE 'invalid_code' END
  );
  -- neutralise toute journalisation supplémentaire dans la même transaction
  PERFORM set_config('kp.code_guard', 'logged', true);
END;
$$;
REVOKE ALL ON FUNCTION public.code_access_record(text, text, boolean) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 1C/1D. RPC protégées (contrats de retour INCHANGÉS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_bookings JSONB;
BEGIN
  IF NOT public.code_access_guard(p_code, 'get_package_by_code') THEN
    RETURN NULL; -- réponse identique à un code inexistant
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code LIMIT 1;
  IF NOT FOUND THEN
    PERFORM public.code_access_record(p_code, 'get_package_by_code', false);
    RETURN NULL;
  END IF;
  PERFORM public.code_access_record(p_code, 'get_package_by_code', true);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'daily_group_id', b.daily_group_id,
    'status', b.status,
    'date', dg.date,
    'activity', dg.activity::text,
    'created_at', b.created_at
  ) ORDER BY dg.date), '[]'::jsonb)
  INTO v_bookings
  FROM public.package_bookings b
  LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
  WHERE b.package_id = v_pkg.id;

  RETURN jsonb_build_object(
    'id', v_pkg.id,
    'package_code', v_pkg.package_code,
    'first_name', v_pkg.first_name,
    'last_name', v_pkg.last_name,
    'email', v_pkg.email,
    'activity', v_pkg.activity,
    'package_type', v_pkg.package_type,
    'total_sessions', v_pkg.total_sessions,
    'used_sessions', v_pkg.used_sessions,
    'remaining_sessions', v_pkg.total_sessions - v_pkg.used_sessions,
    'status', v_pkg.status,
    'expires_at', v_pkg.expires_at,
    'deposit_amount', v_pkg.deposit_amount,
    'bookings', v_bookings
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_credits_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_pkg_ids uuid[]; v jsonb;
BEGIN
  IF NOT public.code_access_guard(p_code, 'get_credits_by_code') THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT array_agg(id) INTO v_pkg_ids FROM public.client_packages WHERE package_code = p_code;
  IF v_pkg_ids IS NULL THEN
    PERFORM public.code_access_record(p_code, 'get_credits_by_code', false);
    RETURN '[]'::jsonb;
  END IF;
  PERFORM public.code_access_record(p_code, 'get_credits_by_code', true);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'activity', c.activity, 'origin', c.origin,
    'status', CASE WHEN c.status = 'available' AND c.expires_at < now() THEN 'expired' ELSE c.status END,
    'created_at', c.created_at, 'expires_at', c.expires_at, 'consumed_at', c.consumed_at
  ) ORDER BY c.expires_at ASC), '[]'::jsonb) INTO v
  FROM public.session_credits c WHERE c.package_id = ANY(v_pkg_ids);
  RETURN v;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_package_credits_history(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_pkg_id uuid; v jsonb;
BEGIN
  IF NOT public.code_access_guard(p_code, 'get_package_credits_history') THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code LIMIT 1;
  IF v_pkg_id IS NULL THEN
    PERFORM public.code_access_record(p_code, 'get_package_credits_history', false);
    RETURN '[]'::jsonb;
  END IF;
  PERFORM public.code_access_record(p_code, 'get_package_credits_history', true);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'delta', h.delta,
    'kind', h.kind,
    'reason', h.reason,
    'balance_after', h.balance_after,
    'created_at', h.created_at,
    'is_weather', (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%météo%')
                  OR (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%meteo%')
  ) ORDER BY h.created_at DESC), '[]'::jsonb) INTO v
  FROM public.package_credit_history h
  WHERE h.package_id = v_pkg_id;
  RETURN v;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_wallet_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_exists boolean; v_wallet jsonb;
BEGIN
  IF NOT public.code_access_guard(p_code, 'get_wallet_by_code') THEN
    RETURN jsonb_build_object('wallet','[]'::jsonb,'history','[]'::jsonb,'credits','[]'::jsonb);
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.client_packages WHERE package_code = p_code) INTO v_exists;
  PERFORM public.code_access_record(p_code, 'get_wallet_by_code', v_exists);
  IF NOT v_exists THEN
    RETURN jsonb_build_object('wallet','[]'::jsonb,'history','[]'::jsonb,'credits','[]'::jsonb);
  END IF;

  SELECT COALESCE((
    SELECT jsonb_agg(to_jsonb(w) - 'email')
    FROM public.client_credit_wallet w
    WHERE w.package_code = p_code
  ), '[]'::jsonb) INTO v_wallet;

  RETURN jsonb_build_object(
    'wallet', v_wallet,
    'history', public.get_package_credits_history(p_code),
    'credits', public.get_credits_by_code(p_code)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.book_daily_with_code(p_code text, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_group_id UUID;
  v_booking_id UUID;
  v_valid INT;
BEGIN
  IF NOT public.code_access_guard(p_code, 'book_daily_with_code') THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_code');
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM public.code_access_record(p_code, 'book_daily_with_code', false);
    RETURN jsonb_build_object('ok',false,'error','invalid_code');
  END IF;
  PERFORM public.code_access_record(p_code, 'book_daily_with_code', true);

  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok',false,'error','no_credits_left');
  END IF;
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'error','date_in_past'); END IF;

  SELECT COUNT(*) INTO v_valid FROM public.session_credits
   WHERE package_id = v_pkg.id AND status = 'available' AND expires_at >= now();
  IF v_valid = 0 THEN
    RETURN jsonb_build_object('ok',false,'error','credits_expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.package_bookings pb
    JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
    WHERE pb.package_id = v_pkg.id AND dg.date = p_date AND pb.status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('ok',false,'error','already_booked_this_date');
  END IF;

  v_group_id := public.find_or_create_daily_group(p_date, v_pkg.activity, 1);

  INSERT INTO public.package_bookings(package_id, daily_group_id, status, booking_kind)
    VALUES (v_pkg.id, v_group_id, 'confirmed', 'regular')
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('ok',true,'booking_id',v_booking_id,'daily_group_id',v_group_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg_id uuid;
  v_date date;
BEGIN
  IF NOT public.code_access_guard(p_code, 'cancel_booking_with_code') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF NOT FOUND THEN
    PERFORM public.code_access_record(p_code, 'cancel_booking_with_code', false);
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  PERFORM public.code_access_record(p_code, 'cancel_booking_with_code', true);

  SELECT dg.date INTO v_date
    FROM public.package_bookings b
    LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
   WHERE b.id = p_booking_id AND b.package_id = v_pkg_id;
  IF NOT FOUND OR v_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'booking_not_found');
  END IF;

  IF v_date <= (CURRENT_DATE + interval '2 days')::date THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late_to_cancel');
  END IF;

  UPDATE public.package_bookings
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_booking_id AND status = 'confirmed';

  RETURN jsonb_build_object('ok', true);
END;
$function$;