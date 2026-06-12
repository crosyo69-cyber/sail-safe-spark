CREATE OR REPLACE FUNCTION public.handle_session_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_reason_block text := '';
  v_reason_text text := '';
BEGIN
  IF NOT (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled') THEN
    RETURN NEW;
  END IF;

  v_slot := CASE NEW.time_slot::text
    WHEN 'morning' THEN 'Matin'
    WHEN 'early_afternoon' THEN 'Début d''après-midi'
    WHEN 'late_afternoon' THEN 'Fin d''après-midi'
    ELSE NEW.time_slot::text END;
  v_activity := CASE NEW.activity::text
    WHEN 'kitesurf' THEN 'Kitesurf'
    WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté'
    ELSE NEW.activity::text END;
  v_date := to_char(NEW.date, 'DD/MM/YYYY');

  IF NEW.cancellation_reason IS NOT NULL AND length(trim(NEW.cancellation_reason)) > 0 THEN
    v_reason_block := concat(
      '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:12px 16px;border-radius:6px;margin:0 0 16px;">',
      '<p style="margin:0;color:#0F172A;font-size:13px;"><strong>Motif :</strong> ', trim(NEW.cancellation_reason), '</p>',
      '</div>'
    );
    v_reason_text := concat(' Motif : ', trim(NEW.cancellation_reason), '.');
  END IF;

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
        'Votre session <strong>', v_activity, '</strong> du <strong>', v_date, ' (', v_slot, ')</strong> est annulée par l''école.',
        '</p>',
        v_reason_block,
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
        'text', concat('Votre session ', v_activity, ' du ', v_date, ' est annulée.', v_reason_text, ' Crédit restitué : ', v_remaining, '/', v_booking.total_sessions),
        'purpose', 'transactional', 'label', 'session-cancelled',
        'queued_at', now()
      ));

      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg_id::text, 'session-cancelled', v_booking.email, 'pending');
    END IF;
  END LOOP;

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
        v_reason_block,
        '<p style="font-size:15px;color:#64748B;line-height:1.6;">Contactez-nous au 06 72 71 69 05 pour reprogrammer.</p>',
        '</td></tr></table></body></html>'
      );

      PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
        'run_id', v_run_id, 'message_id', v_msg_id,
        'to', v_resv.email,
        'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
        'sender_domain', 'kitesurfpassion.fr',
        'subject', v_subject, 'html', v_html,
        'text', concat('Votre session ', v_activity, ' du ', v_date, ' est annulée.', v_reason_text),
        'purpose', 'transactional', 'label', 'session-cancelled',
        'queued_at', now()
      ));
      INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
      VALUES (v_msg_id::text, 'session-cancelled', v_resv.email, 'pending');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Apply the same fix to enqueue_booking_confirmation
CREATE OR REPLACE FUNCTION public.enqueue_booking_confirmation(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  v_slot := CASE v_session.time_slot::text
    WHEN 'morning' THEN 'Matin'
    WHEN 'early_afternoon' THEN 'Début d''après-midi'
    WHEN 'late_afternoon' THEN 'Fin d''après-midi'
    ELSE v_session.time_slot::text END;
  v_activity := CASE v_session.activity::text
    WHEN 'kitesurf' THEN 'Kitesurf'
    WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté'
    ELSE v_session.activity::text END;
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
$function$;