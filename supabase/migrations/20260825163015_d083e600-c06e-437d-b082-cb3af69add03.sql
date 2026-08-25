-- ============================================================
-- LOT C-2.2-D — FLUX OTP + SESSION OPAQUE + MIGRATION DES 8 RPC MÉTIER
-- ============================================================

-- ------------------------------------------------------------------
-- 1. SESSION : validation + TTL glissant 30 min / absolu 4 h
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_otp_session(p_session_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  IF p_session_token IS NULL OR btrim(p_session_token) = '' THEN
    RETURN NULL;
  END IF;

  UPDATE public.otp_sessions
     SET last_seen_at = now()
   WHERE token_hash = public.code_access_hash('otp_session:' || btrim(p_session_token))
     AND revoked_at IS NULL
     AND absolute_expires_at > now()
     AND last_seen_at > now() - interval '30 minutes'
  RETURNING package_id INTO v_pkg;

  RETURN v_pkg;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_otp_session(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.revoke_otp_session(p_session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_session_token IS NOT NULL AND btrim(p_session_token) <> '' THEN
    UPDATE public.otp_sessions
       SET revoked_at = now()
     WHERE token_hash = public.code_access_hash('otp_session:' || btrim(p_session_token))
       AND revoked_at IS NULL;
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_otp_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_otp_session(text) TO anon, authenticated;

-- ------------------------------------------------------------------
-- 2. REQUEST OTP — réponse uniforme, rate-limit, e-mail idempotent
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_otp(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pkg      public.client_packages;
  v_ip       text;
  v_ip_hash  text;
  v_last     timestamptz;
  v_cnt_pkg  int;
  v_cnt_ip   int;
  v_ch       jsonb;
  v_otp      text;
  v_chid     uuid;
  v_html     text;
BEGIN
  -- premier facteur + protections C-2.2-A/B (IP + code_hash)
  IF NOT public.code_access_guard(p_code, 'request_otp') THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = upper(btrim(coalesce(p_code, ''))) LIMIT 1;

  PERFORM public.code_access_record(p_code, 'request_otp', v_pkg.id IS NOT NULL);

  IF v_pkg.id IS NULL OR v_pkg.email IS NULL THEN
    RETURN jsonb_build_object('ok', true);   -- réponse uniforme
  END IF;

  v_ip := public.code_access_client_ip();
  v_ip_hash := CASE WHEN v_ip IS NULL THEN NULL ELSE public.code_access_hash('ip:' || v_ip) END;

  -- sérialisation par package : compteurs atomiques
  PERFORM pg_advisory_xact_lock(hashtext('otp_request:' || v_pkg.id::text));

  SELECT max(created_at), count(*) FILTER (WHERE created_at > now() - interval '15 minutes')
    INTO v_last, v_cnt_pkg
    FROM public.otp_challenges
   WHERE package_id = v_pkg.id;

  -- cooldown 60 s
  IF v_last IS NOT NULL AND v_last > now() - interval '60 seconds' THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  -- max 3 demandes / 15 min / package
  IF v_cnt_pkg >= 3 THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  -- max 5 demandes / 15 min / IP
  IF v_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_cnt_ip FROM public.otp_challenges
     WHERE ip_hash = v_ip_hash AND created_at > now() - interval '15 minutes';
    IF v_cnt_ip >= 5 THEN
      RETURN jsonb_build_object('ok', true);
    END IF;
  END IF;

  v_ch := public.otp_create_challenge(v_pkg.id, v_ip_hash);
  IF NOT coalesce((v_ch->>'ok')::boolean, false) THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  v_otp  := v_ch->>'otp';
  v_chid := (v_ch->>'challenge_id')::uuid;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Votre code de sécurité</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    'Voici le code à saisir pour accéder à votre espace KiteSurf Passion.</p></td></tr>',
    '<tr><td style="padding:0 25px 16px;text-align:center;">',
    '<div style="background:#f1f5f9;border-radius:12px;padding:24px;">',
    '<p style="margin:0;color:#0891B2;font-size:34px;font-weight:bold;letter-spacing:8px;">', v_otp, '</p>',
    '</div></td></tr>',
    '<tr><td style="padding:0 25px 16px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">',
    'Ce code est valable <strong>10 minutes</strong>. Si vous n''êtes pas à l''origine de cette demande, ',
    'ignorez simplement cet e-mail : aucun accès n''a été accordé.</p></div></td></tr>',
    '<tr><td style="padding:0 25px 32px;">',
    '<p style="font-size:13px;color:#94A3B8;line-height:1.6;margin:0;">',
    'KiteSurf Passion — Hyères · 06 72 71 69 05</p></td></tr></table></body></html>'
  );

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(),
    'message_id', 'otp-' || v_chid::text,   -- idempotent : 1 challenge = 1 message
    'template_name', 'otp_code',
    'to', v_pkg.email,
    'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr',
    'purpose', 'transactional',
    'label', 'otp_code',
    'queued_at', now(),
    'subject', 'Votre code de sécurité KiteSurf Passion',
    'html', v_html,
    'text', 'Votre code de sécurité KiteSurf Passion : ' || v_otp
            || ' (valable 10 minutes). Si vous n''êtes pas à l''origine de cette demande, ignorez cet e-mail.'
  ));

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.request_otp(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_otp(text) TO anon, authenticated;

-- ------------------------------------------------------------------
-- 3. VERIFY OTP — réponse générique, anti-replay, session opaque
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_otp(p_code text, p_otp text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pkg  uuid;
  v_chid uuid;
  v_res  jsonb;
BEGIN
  IF NOT public.code_access_guard(p_code, 'verify_otp') THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT id INTO v_pkg FROM public.client_packages
   WHERE package_code = upper(btrim(coalesce(p_code, ''))) LIMIT 1;

  PERFORM public.code_access_record(p_code, 'verify_otp', v_pkg IS NOT NULL);

  IF v_pkg IS NULL OR p_otp IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  SELECT id INTO v_chid FROM public.otp_challenges
   WHERE package_id = v_pkg
     AND consumed_at IS NULL AND invalidated_at IS NULL AND expires_at > now()
   ORDER BY created_at DESC LIMIT 1;

  IF v_chid IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  v_res := public.otp_verify_challenge(v_chid, p_otp);

  IF NOT coalesce((v_res->>'ok')::boolean, false) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  RETURN jsonb_build_object('ok', true, 'session_token', v_res->>'session_token',
                            'absolute_expires_at', v_res->>'absolute_expires_at');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_otp(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_otp(text, text) TO anon, authenticated;

-- ------------------------------------------------------------------
-- 4. PAYLOADS INTERNES (par package_id, jamais par code)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_package_payload(p_pkg uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg public.client_packages; v_bookings jsonb;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_pkg;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id, 'daily_group_id', b.daily_group_id, 'status', b.status,
    'date', dg.date, 'activity', dg.activity::text, 'created_at', b.created_at
  ) ORDER BY dg.date), '[]'::jsonb) INTO v_bookings
  FROM public.package_bookings b
  LEFT JOIN public.daily_groups dg ON dg.id = b.daily_group_id
  WHERE b.package_id = v_pkg.id;

  RETURN jsonb_build_object(
    'id', v_pkg.id, 'package_code', v_pkg.package_code,
    'first_name', v_pkg.first_name, 'last_name', v_pkg.last_name, 'email', v_pkg.email,
    'activity', v_pkg.activity, 'package_type', v_pkg.package_type,
    'total_sessions', v_pkg.total_sessions, 'used_sessions', v_pkg.used_sessions,
    'remaining_sessions', v_pkg.total_sessions - v_pkg.used_sessions,
    'status', v_pkg.status, 'expires_at', v_pkg.expires_at,
    'deposit_amount', v_pkg.deposit_amount, 'bookings', v_bookings);
END;
$$;
REVOKE ALL ON FUNCTION public.client_package_payload(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.client_credits_payload(p_pkg uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'activity', c.activity, 'origin', c.origin,
    'status', CASE WHEN c.status = 'available' AND c.expires_at < now() THEN 'expired' ELSE c.status END,
    'created_at', c.created_at, 'expires_at', c.expires_at, 'consumed_at', c.consumed_at
  ) ORDER BY c.expires_at ASC), '[]'::jsonb)
  FROM public.session_credits c WHERE c.package_id = p_pkg;
$$;
REVOKE ALL ON FUNCTION public.client_credits_payload(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.client_history_payload(p_pkg uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', h.id, 'delta', h.delta, 'kind', h.kind, 'reason', h.reason,
    'balance_after', h.balance_after, 'created_at', h.created_at,
    'is_weather', (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%météo%')
                  OR (h.kind = 'admin_credit' AND lower(coalesce(h.reason,'')) LIKE '%meteo%')
  ) ORDER BY h.created_at DESC), '[]'::jsonb)
  FROM public.package_credit_history h WHERE h.package_id = p_pkg;
$$;
REVOKE ALL ON FUNCTION public.client_history_payload(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.client_wallet_payload(p_pkg uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_wallet jsonb;
BEGIN
  SELECT COALESCE((
    SELECT jsonb_agg(to_jsonb(w) - 'email')
    FROM public.client_credit_wallet w WHERE w.package_id = p_pkg
  ), '[]'::jsonb) INTO v_wallet;

  RETURN jsonb_build_object(
    'wallet', v_wallet,
    'history', public.client_history_payload(p_pkg),
    'credits', public.client_credits_payload(p_pkg));
END;
$$;
REVOKE ALL ON FUNCTION public.client_wallet_payload(uuid) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------
-- 5. RPC MÉTIER — UNIQUEMENT PAR SESSION
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_package_by_session(p_session_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN RETURN NULL; END IF;
  RETURN public.client_package_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credits_by_session(p_session_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN public.client_credits_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_package_credits_history_by_session(p_session_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN RETURN '[]'::jsonb; END IF;
  RETURN public.client_history_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_wallet_by_session(p_session_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('wallet','[]'::jsonb,'history','[]'::jsonb,'credits','[]'::jsonb);
  END IF;
  RETURN public.client_wallet_payload(v_pkg);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_credit_reminders_by_session(p_session_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid; v_res jsonb;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true);
  END IF;
  SELECT jsonb_build_object(
    'remind_30', COALESCE(p.remind_30, true),
    'remind_7',  COALESCE(p.remind_7, true),
    'remind_0',  COALESCE(p.remind_0, true))
    INTO v_res
    FROM public.client_packages cp
    LEFT JOIN public.credit_reminder_preferences p ON p.package_id = cp.id
   WHERE cp.id = v_pkg LIMIT 1;
  RETURN COALESCE(v_res, jsonb_build_object('remind_30', true, 'remind_7', true, 'remind_0', true));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_credit_reminders_by_session(
  p_session_token text, p_remind_30 boolean, p_remind_7 boolean, p_remind_0 boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  v_pkg := public.validate_otp_session(p_session_token);
  IF v_pkg IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_invalid'); END IF;

  INSERT INTO public.credit_reminder_preferences (package_id, remind_30, remind_7, remind_0)
  VALUES (v_pkg, COALESCE(p_remind_30, true), COALESCE(p_remind_7, true), COALESCE(p_remind_0, true))
  ON CONFLICT (package_id) DO UPDATE
    SET remind_30 = EXCLUDED.remind_30, remind_7 = EXCLUDED.remind_7,
        remind_0 = EXCLUDED.remind_0, updated_at = now();

  RETURN jsonb_build_object('ok', true,
    'remind_30', COALESCE(p_remind_30, true),
    'remind_7',  COALESCE(p_remind_7, true),
    'remind_0',  COALESCE(p_remind_0, true));
END;
$$;

CREATE OR REPLACE FUNCTION public.book_daily_with_session(p_session_token text, p_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_pkg_id uuid; v_pkg public.client_packages;
  v_group_id uuid; v_booking_id uuid; v_valid int;
BEGIN
  v_pkg_id := public.validate_otp_session(p_session_token);
  IF v_pkg_id IS NULL THEN RETURN jsonb_build_object('ok',false,'error','session_invalid'); END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE id = v_pkg_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','session_invalid'); END IF;

  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok',false,'error','package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok',false,'error','package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok',false,'error','no_credits_left');
  END IF;
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'error','date_in_past'); END IF;

  SELECT COUNT(*) INTO v_valid FROM public.session_credits
   WHERE package_id = v_pkg.id AND status = 'available' AND expires_at >= now();
  IF v_valid = 0 THEN RETURN jsonb_build_object('ok',false,'error','credits_expired'); END IF;

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
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking_with_session(p_session_token text, p_booking_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg_id uuid; v_date date;
BEGIN
  v_pkg_id := public.validate_otp_session(p_session_token);
  IF v_pkg_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'session_invalid'); END IF;

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
$$;

REVOKE ALL ON FUNCTION public.get_package_by_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_credits_by_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_package_credits_history_by_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_wallet_by_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_credit_reminders_by_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_credit_reminders_by_session(text, boolean, boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_daily_with_session(text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_booking_with_session(text, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_package_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credits_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_package_credits_history_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_reminders_by_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_credit_reminders_by_session(text, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_daily_with_session(text, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_session(text, uuid) TO anon, authenticated;

-- ------------------------------------------------------------------
-- 6. ACCÈS ADMIN AU WALLET (remplace l'usage admin de get_wallet_by_code)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_wallet_by_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_pkg uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT id INTO v_pkg FROM public.client_packages WHERE package_code = p_code LIMIT 1;
  IF v_pkg IS NULL THEN
    RETURN jsonb_build_object('wallet','[]'::jsonb,'history','[]'::jsonb,'credits','[]'::jsonb);
  END IF;
  RETURN public.client_wallet_payload(v_pkg);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_wallet_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_wallet_by_code(text) TO authenticated;

-- ------------------------------------------------------------------
-- 7. SUPPRESSION DES CHEMINS LEGACY « package_code seul »
-- ------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_wallet_by_code(text);
DROP FUNCTION IF EXISTS public.get_package_by_code(text);
DROP FUNCTION IF EXISTS public.get_credits_by_code(text);
DROP FUNCTION IF EXISTS public.get_package_credits_history(text);
DROP FUNCTION IF EXISTS public.book_daily_with_code(text, date);
DROP FUNCTION IF EXISTS public.cancel_booking_with_code(text, uuid);
DROP FUNCTION IF EXISTS public.get_credit_reminders(text);
DROP FUNCTION IF EXISTS public.set_credit_reminders(text, boolean, boolean, boolean);