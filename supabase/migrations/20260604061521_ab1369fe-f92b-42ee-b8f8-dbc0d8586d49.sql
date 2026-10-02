-- ============================================================
-- 1) Helper: enqueue booking confirmation email (with remaining credits)
-- ============================================================
CREATE OR REPLACE FUNCTION public.enqueue_booking_confirmation(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_session public.sessions;
  v_msg_id uuid := gen_random_uuid();
  v_run_id uuid := gen_random_uuid();
  v_slot text;
  v_activity text;
  v_date text;
  v_remaining int;
  v_html text;
  v_subject text;
BEGIN
  SELECT cp.* INTO v_pkg
    FROM public.package_bookings pb
    JOIN public.client_packages cp ON cp.id = pb.package_id
   WHERE pb.id = p_booking_id;
  IF NOT FOUND OR v_pkg.email IS NULL THEN RETURN; END IF;

  SELECT s.* INTO v_session
    FROM public.package_bookings pb
    JOIN public.sessions s ON s.id = pb.session_id
   WHERE pb.id = p_booking_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_slot := CASE v_session.time_slot
    WHEN 'morning' THEN 'Matin'
    WHEN 'early_afternoon' THEN 'Début d''après-midi'
    WHEN 'late_afternoon' THEN 'Fin d''après-midi'
    ELSE v_session.time_slot END;
  v_activity := CASE v_session.activity
    WHEN 'kitesurf' THEN 'Kitesurf'
    WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté'
    ELSE v_session.activity END;
  v_date := to_char(v_session.date, 'DD/MM/YYYY');
  v_remaining := v_pkg.total_sessions - v_pkg.used_sessions;

  v_subject := 'Réservation confirmée — ' || v_activity || ' du ' || v_date;
  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_pkg.first_name,''), ', votre session est confirmée 🪁</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    'Nous avons bien enregistré votre inscription à la session ci-dessous.',
    '</p></td></tr>',
    '<tr><td style="padding:0 25px 16px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;">',
    '<tr><td style="padding:20px;">',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Activité</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:18px;font-weight:bold;">', v_activity, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date & créneau</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:16px;font-weight:600;">', v_date, ' · ', v_slot, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Sessions restantes</p>',
    '<p style="margin:0;color:#0891B2;font-size:24px;font-weight:bold;">', v_remaining, ' / ', v_pkg.total_sessions, '</p>',
    '</td></tr></table></td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<p style="font-size:14px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    '📍 Rendez-vous au spot de l''Almanarre, Hyères. La décision finale d''ouverture de la session sera communiquée selon les conditions du jour.',
    '</p>',
    '<a href="https://www.kitesurfpassion.fr/mon-espace/', v_pkg.package_code, '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Gérer mes réservations</a>',
    '</td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">Kitesurf Passion · 06 72 71 69 05 · École itinérante depuis 1999</p>',
    '</td></tr></table></body></html>'
  );

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', v_run_id, 'message_id', v_msg_id,
    'to', v_pkg.email,
    'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr',
    'subject', v_subject, 'html', v_html,
    'text', concat('Votre session ', v_activity, ' du ', v_date, ' (', v_slot, ') est confirmée. Sessions restantes : ', v_remaining, '/', v_pkg.total_sessions),
    'purpose', 'transactional', 'label', 'booking-confirmation',
    'queued_at', now()
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'booking-confirmation', v_pkg.email, 'pending');
END;
$$;

-- ============================================================
-- 2) Update book_session_with_code: enqueue confirmation email
-- ============================================================
CREATE OR REPLACE FUNCTION public.book_session_with_code(p_code text, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.client_packages;
  v_session public.sessions;
  v_current_count integer;
  v_booking_id uuid;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages
   WHERE package_code = p_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;
  IF v_pkg.status <> 'active' THEN RETURN jsonb_build_object('ok', false, 'error', 'package_not_active'); END IF;
  IF v_pkg.expires_at < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'package_expired'); END IF;
  IF v_pkg.used_sessions >= v_pkg.total_sessions THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_credits_left');
  END IF;

  SELECT * INTO v_session FROM public.sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'session_not_found'); END IF;
  IF v_session.activity <> v_pkg.activity THEN RETURN jsonb_build_object('ok', false, 'error', 'activity_mismatch'); END IF;
  IF v_session.status <> 'open' THEN RETURN jsonb_build_object('ok', false, 'error', 'session_closed'); END IF;
  IF v_session.date < CURRENT_DATE THEN RETURN jsonb_build_object('ok', false, 'error', 'session_in_past'); END IF;

  SELECT
    COALESCE((SELECT SUM(participants) FROM public.reservations
               WHERE session_id = p_session_id AND status <> 'cancelled'), 0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE session_id = p_session_id AND status = 'confirmed'), 0)
  INTO v_current_count;

  IF v_current_count >= v_session.max_participants THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_full');
  END IF;

  BEGIN
    INSERT INTO public.package_bookings (package_id, session_id, status)
      VALUES (v_pkg.id, p_session_id, 'confirmed')
    ON CONFLICT (package_id, session_id) DO UPDATE
      SET status = 'confirmed', updated_at = now()
    RETURNING id INTO v_booking_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
  END;

  -- Send confirmation email (with remaining credits after this booking)
  PERFORM public.enqueue_booking_confirmation(v_booking_id);

  RETURN jsonb_build_object('ok', true, 'booking_id', v_booking_id);
END;
$$;

-- ============================================================
-- 3) Session cancellation: auto-refund + email each inscrit
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_session_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_resv record;
  v_msg_id uuid;
  v_run_id uuid;
  v_html text;
  v_subject text;
  v_slot text;
  v_activity text;
  v_date text;
  v_remaining int;
BEGIN
  IF NOT (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled') THEN
    RETURN NEW;
  END IF;

  v_slot := CASE NEW.time_slot
    WHEN 'morning' THEN 'Matin'
    WHEN 'early_afternoon' THEN 'Début d''après-midi'
    WHEN 'late_afternoon' THEN 'Fin d''après-midi'
    ELSE NEW.time_slot END;
  v_activity := CASE NEW.activity
    WHEN 'kitesurf' THEN 'Kitesurf'
    WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté'
    ELSE NEW.activity END;
  v_date := to_char(NEW.date, 'DD/MM/YYYY');

  -- Cancel each package booking. The sync_package_used_sessions trigger refunds the credit.
  FOR v_booking IN
    SELECT pb.id AS booking_id, cp.email, cp.first_name, cp.package_code,
           cp.total_sessions, cp.used_sessions
      FROM public.package_bookings pb
      JOIN public.client_packages cp ON cp.id = pb.package_id
     WHERE pb.session_id = NEW.id AND pb.status = 'confirmed'
  LOOP
    UPDATE public.package_bookings SET status = 'cancelled', updated_at = now()
     WHERE id = v_booking.booking_id;

    IF v_booking.email IS NOT NULL THEN
      -- After refund, remaining = total - (used - 1)
      v_remaining := v_booking.total_sessions - v_booking.used_sessions + 1;
      v_msg_id := gen_random_uuid();
      v_run_id := gen_random_uuid();
      v_subject := 'Session annulée — ' || v_activity || ' du ' || v_date;
      v_html := concat(
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
        '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
        '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
        '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180"/></td></tr>',
        '<tr><td style="padding:32px 25px;">',
        '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_booking.first_name,''), ',</h1>',
        '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 12px;">',
        'Votre session <strong>', v_activity, '</strong> du <strong>', v_date, ' (', v_slot, ')</strong> est annulée par l''école (conditions du jour ou décision technique).',
        '</p>',
        '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
        '✅ <strong>Votre crédit a été automatiquement restitué</strong> sur votre pack.',
        '</p>',
        '<div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;">',
        '<p style="margin:0;color:#0F172A;font-size:14px;">Code pack : <strong style="font-family:Menlo,monospace;letter-spacing:1px;">', v_booking.package_code, '</strong></p>',
        '<p style="margin:8px 0 0;color:#0891B2;font-size:18px;font-weight:bold;">Sessions restantes : ', v_remaining, ' / ', v_booking.total_sessions, '</p>',
        '</div>',
        '<a href="https://www.kitesurfpassion.fr/mon-espace/', v_booking.package_code, '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;margin-top:8px;">Choisir un nouveau créneau</a>',
        '</td></tr>',
        '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;"><p style="font-size:12px;color:#94a3b8;margin:0;">📍 Spot de l''Almanarre, Hyères · 06 72 71 69 05</p></td></tr>',
        '</table></body></html>'
      );

      PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
        'run_id', v_run_id, 'message_id', v_msg_id,
        'to', v_booking.email,
        'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
        'sender_domain', 'kitesurfpassion.fr',
        'subject', v_subject, 'html', v_html,
        'text', concat('Votre session ', v_activity, ' du ', v_date, ' est annulée. Crédit restitué : ', v_remaining, '/', v_booking.total_sessions),
        'purpose', 'transactional', 'label', 'session-cancelled',
        'queued_at', now()
      ));

      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg_id::text, 'session-cancelled', v_booking.email, 'pending');
    END IF;
  END LOOP;

  -- Cancel direct reservations (no credit system but notify)
  FOR v_resv IN
    SELECT id, email, first_name FROM public.reservations
     WHERE session_id = NEW.id AND status <> 'cancelled'
  LOOP
    UPDATE public.reservations SET status = 'cancelled' WHERE id = v_resv.id;

    IF v_resv.email IS NOT NULL THEN
      v_msg_id := gen_random_uuid();
      v_run_id := gen_random_uuid();
      v_subject := 'Session annulée — ' || v_activity || ' du ' || v_date;
      v_html := concat(
        '<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
        '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
        '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180"/></td></tr>',
        '<tr><td style="padding:32px 25px;">',
        '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_resv.first_name,''), ',</h1>',
        '<p style="font-size:15px;color:#64748B;line-height:1.6;">Votre session <strong>', v_activity, '</strong> du <strong>', v_date, ' (', v_slot, ')</strong> est annulée par l''école.</p>',
        '<p style="font-size:15px;color:#64748B;line-height:1.6;">Contactez-nous au 06 72 71 69 05 pour reprogrammer.</p>',
        '</td></tr></table></body></html>'
      );

      PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
        'run_id', v_run_id, 'message_id', v_msg_id,
        'to', v_resv.email,
        'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
        'sender_domain', 'kitesurfpassion.fr',
        'subject', v_subject, 'html', v_html,
        'text', concat('Votre session ', v_activity, ' du ', v_date, ' est annulée.'),
        'purpose', 'transactional', 'label', 'session-cancelled',
        'queued_at', now()
      ));
      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg_id::text, 'session-cancelled', v_resv.email, 'pending');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_cancellation ON public.sessions;
CREATE TRIGGER trg_session_cancellation
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_session_cancellation();