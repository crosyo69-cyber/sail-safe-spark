-- ROLLBACK LOT C-2 PHASE 1 — restauration exacte de l'etat pre-migration (snapshot 2026-08-25 10:5x UTC)
-- Etape 1 : restauration des 6 fonctions dans leur definition d'origine (STABLE/SQL inclus)
CREATE OR REPLACE FUNCTION public.book_daily_with_code(p_code text, p_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_group_id UUID;
  v_booking_id UUID;
  v_valid INT;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
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
$function$

;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_code(p_code text, p_booking_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg_id uuid;
  v_date date;
BEGIN
  SELECT id INTO v_pkg_id FROM public.client_packages WHERE package_code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

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
$function$

;

CREATE OR REPLACE FUNCTION public.get_credits_by_code(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_pkg_ids uuid[]; v jsonb;
BEGIN
  SELECT array_agg(id) INTO v_pkg_ids FROM public.client_packages WHERE package_code = p_code;
  IF v_pkg_ids IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'activity', c.activity, 'origin', c.origin,
    'status', CASE WHEN c.status = 'available' AND c.expires_at < now() THEN 'expired' ELSE c.status END,
    'created_at', c.created_at, 'expires_at', c.expires_at, 'consumed_at', c.consumed_at
  ) ORDER BY c.expires_at ASC), '[]'::jsonb) INTO v
  FROM public.session_credits c WHERE c.package_id = ANY(v_pkg_ids);
  RETURN v;
END;
$function$

;

CREATE OR REPLACE FUNCTION public.get_package_by_code(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_bookings JSONB;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

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
$function$

;

CREATE OR REPLACE FUNCTION public.get_package_credits_history(p_code text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pkg AS (
    SELECT id FROM public.client_packages WHERE package_code = p_code LIMIT 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', h.id,
    'delta', h.delta,
    'kind', h.kind,
    'reason', h.reason,
    'balance_after', h.balance_after,
    'created_at', h.created_at,
    'is_weather', (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%météo%')
                  OR (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%meteo%')
  ) ORDER BY h.created_at DESC), '[]'::jsonb)
  FROM public.package_credit_history h
  WHERE h.package_id = (SELECT id FROM pkg);
$function$

;

CREATE OR REPLACE FUNCTION public.get_wallet_by_code(p_code text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'wallet', COALESCE((
      SELECT jsonb_agg(to_jsonb(w) - 'email')
      FROM public.client_credit_wallet w
      WHERE w.package_code = p_code
    ), '[]'::jsonb),
    'history', public.get_package_credits_history(p_code),
    'credits', public.get_credits_by_code(p_code)
  );
$function$

;


-- Etape 2 : suppression de la couche de journalisation / anti-enumeration
DROP FUNCTION IF EXISTS public.code_access_record(text, text, boolean);
DROP FUNCTION IF EXISTS public.code_access_guard(text, text);
DROP FUNCTION IF EXISTS public.code_access_client_ip();
DROP FUNCTION IF EXISTS public.code_access_hash(text);
DROP TABLE IF EXISTS public.code_access_attempts;
DROP TABLE IF EXISTS public.code_access_secret;

-- Etape 3 : GRANT EXECUTE d'origine (inchanges par la migration, rappeles pour verification)
-- get_package_by_code / get_wallet_by_code / get_credits_by_code /
-- get_package_credits_history / book_daily_with_code / cancel_booking_with_code :
--   EXECUTE TO PUBLIC, anon, authenticated, service_role  (etat identique avant/apres)
-- Aucune donnee metier a restaurer : la migration n'a touche aucune table metier.
