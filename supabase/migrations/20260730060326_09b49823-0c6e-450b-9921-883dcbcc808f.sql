-- Blocage des crédits expirés à la réservation
CREATE OR REPLACE FUNCTION public.book_daily_with_code(p_code text, p_date date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
$$;

-- Emails d'expiration (J-30, J-7, J0)
CREATE OR REPLACE FUNCTION public.enqueue_credit_expiry_notices()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_stage record;
  v_row record;
  v_html text;
  v_subject text;
  v_msg_id uuid;
  v_sent int := 0;
  v_label text;
BEGIN
  FOR v_stage IN SELECT s.days, s.action FROM (VALUES (30,'notified_30'),(7,'notified_7'),(0,'notified_0')) AS s(days, action)
  LOOP
    FOR v_row IN
      SELECT cp.id AS package_id, cp.email, cp.first_name, cp.package_code, cp.activity,
             COUNT(c.id) AS nb, MIN(c.expires_at) AS first_exp,
             array_agg(c.id) AS credit_ids
        FROM public.session_credits c
        JOIN public.client_packages cp ON cp.id = c.package_id
       WHERE c.status = 'available'
         AND c.expires_at::date = (CURRENT_DATE + v_stage.days)
         AND cp.email IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.credit_audit_log a
            WHERE a.credit_id = c.id AND a.action = v_stage.action)
       GROUP BY cp.id, cp.email, cp.first_name, cp.package_code, cp.activity
    LOOP
      v_msg_id := gen_random_uuid();
      v_label := CASE WHEN v_stage.days = 0 THEN 'expirent aujourd''hui'
                      ELSE 'expirent dans ' || v_stage.days || ' jours' END;
      v_subject := v_row.nb::text || ' séance(s) ' || v_label || ' 🪁';

      v_html := concat(
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
        '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
        '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
        '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
        '<tr><td style="padding:32px 25px 0;">',
        '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_row.first_name,''), ', ',
        v_row.nb::text, ' séance(s) ', v_label, '</h1>',
        '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
        'Vos séances de <strong>', v_row.activity::text, '</strong> arrivent à échéance le ',
        to_char(v_row.first_exp, 'DD/MM/YYYY'), '. Réservez une date pour ne rien perdre.',
        '</p></td></tr>',
        '<tr><td style="padding:0 25px 24px;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;">',
        '<tr><td style="padding:20px;text-align:center;">',
        '<p style="margin:0 0 8px;color:#bae6fd;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Votre code</p>',
        '<p style="margin:0 0 14px;color:#fff;font-size:22px;font-weight:bold;letter-spacing:3px;font-family:Menlo,monospace;">', v_row.package_code, '</p>',
        '<a href="https://www.kitesurfpassion.fr/mon-espace/', v_row.package_code, '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Choisir une date</a>',
        '</td></tr></table></td></tr>',
        '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
        '<p style="font-size:12px;color:#94a3b8;margin:0;">KiteSurf Passion — Hyères · 06 72 71 69 05</p>',
        '</td></tr></table></body></html>'
      );

      PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
        'run_id', gen_random_uuid(),
        'message_id', v_msg_id,
        'template_name', 'credit_expiry_notice',
        'to', v_row.email,
        'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
        'sender_domain', 'kitesurfpassion.fr',
        'purpose', 'transactional',
        'label', 'credit_expiry_notice',
        'queued_at', now(),
        'subject', v_subject,
        'html', v_html,
        'text', 'Bonjour ' || coalesce(v_row.first_name,'') || ', ' || v_row.nb::text || ' séance(s) ' || v_label ||
                '. Réservez sur https://www.kitesurfpassion.fr/mon-espace/' || v_row.package_code
      ));

      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg_id::text, 'credit_expiry_notice', v_row.email, 'pending');

      INSERT INTO public.credit_audit_log (credit_id, package_id, action, reason, details)
      SELECT unnest(v_row.credit_ids), v_row.package_id, v_stage.action, 'Notification expiration',
             jsonb_build_object('days', v_stage.days);

      v_sent := v_sent + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('emails', v_sent);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enqueue_credit_expiry_notices() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.run_credit_maintenance()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_exp jsonb; v_mail jsonb;
BEGIN
  v_mail := public.enqueue_credit_expiry_notices();
  v_exp := public.expire_session_credits();
  RETURN jsonb_build_object('expired', v_exp, 'notices', v_mail);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_credit_maintenance() FROM PUBLIC, anon, authenticated;

-- Détail des crédits dans l'espace client
CREATE OR REPLACE FUNCTION public.get_wallet_by_code(p_code text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'wallet', COALESCE((
      SELECT jsonb_agg(to_jsonb(w) - 'email')
      FROM public.client_credit_wallet w
      WHERE w.package_code = p_code
    ), '[]'::jsonb),
    'history', public.get_package_credits_history(p_code),
    'credits', public.get_credits_by_code(p_code)
  );
$$;