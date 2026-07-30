
-- Email de notification de recrédit
CREATE OR REPLACE FUNCTION public.enqueue_recredit_notification(
  p_package_id uuid,
  p_sessions integer,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_html text;
  v_subject text;
  v_msg_id uuid := gen_random_uuid();
  v_remaining int;
  v_label text;
BEGIN
  SELECT * INTO v_pkg FROM public.client_packages WHERE id = p_package_id;
  IF NOT FOUND OR v_pkg.email IS NULL OR COALESCE(p_sessions,0) < 1 THEN RETURN; END IF;

  v_remaining := v_pkg.total_sessions - v_pkg.used_sessions;
  v_label := CASE WHEN p_sessions > 1 THEN p_sessions::text || ' séances ont été recréditées'
                  ELSE 'Votre séance a été recréditée' END;

  v_subject := CASE WHEN p_sessions > 1
                    THEN p_sessions::text || ' séances recréditées sur votre pack 🪁'
                    ELSE 'Votre séance a été recréditée 🪁' END;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_pkg.first_name,''), ', ', v_label, '</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">',
    'La séance n''a pas pu avoir lieu', CASE WHEN p_reason IS NOT NULL AND length(trim(p_reason)) > 0
      THEN ' (' || trim(p_reason) || ')' ELSE '' END, '. ',
    'Aucun paiement n''est perdu : votre crédit est de nouveau disponible dans votre espace client.',
    '</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0891B2,#0F172A);border-radius:12px;">',
    '<tr><td style="padding:20px;text-align:center;">',
    '<p style="margin:0 0 8px;color:#bae6fd;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Séances disponibles</p>',
    '<p style="margin:0 0 14px;color:#fff;font-size:30px;font-weight:bold;">', v_remaining, ' / ', v_pkg.total_sessions, '</p>',
    '<p style="margin:0 0 14px;color:#bae6fd;font-size:13px;">Code pack : <strong style="color:#fff;font-family:Menlo,monospace;letter-spacing:2px;">', v_pkg.package_code, '</strong></p>',
    '<a href="https://www.kitesurfpassion.fr/mon-espace/', v_pkg.package_code, '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Choisir une nouvelle date</a>',
    '</td></tr></table></td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">KiteSurf Passion — Hyères · 06 72 71 69 05</p>',
    '</td></tr></table></body></html>'
  );

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(),
    'message_id', v_msg_id,
    'template_name', 'session_recredit',
    'to', v_pkg.email,
    'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr',
    'purpose', 'transactional',
    'label', 'session_recredit',
    'queued_at', now(),
    'subject', v_subject,
    'html', v_html,
    'text', 'Bonjour ' || coalesce(v_pkg.first_name,'') || ', ' || v_label ||
            '. Séances disponibles : ' || v_remaining || '/' || v_pkg.total_sessions ||
            '. Réservez une nouvelle date : https://www.kitesurfpassion.fr/mon-espace/' || v_pkg.package_code
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'session_recredit', v_pkg.email, 'pending');
END;
$function$;

-- Recrédit manuel de séances (annulation école)
CREATE OR REPLACE FUNCTION public.admin_recredit_package(
  p_package_id uuid,
  p_sessions integer,
  p_reason text,
  p_notify boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_caller uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF COALESCE(p_sessions, 0) < 1 THEN RAISE EXCEPTION 'invalid_sessions'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  UPDATE public.client_packages
     SET total_sessions = total_sessions + p_sessions,
         status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
         updated_at = now()
   WHERE id = p_package_id
  RETURNING * INTO v_pkg;

  IF NOT FOUND THEN RAISE EXCEPTION 'package_not_found'; END IF;

  INSERT INTO public.package_credit_history
    (package_id, delta, kind, reason, performed_by, balance_after)
  VALUES
    (p_package_id, p_sessions, 'admin_credit', trim(p_reason), v_caller,
     v_pkg.total_sessions - v_pkg.used_sessions);

  PERFORM public.enqueue_admin_notification(
    'admin_credit', 'info',
    'Recrédit séance — ' || COALESCE(v_pkg.first_name,'') || ' ' || COALESCE(v_pkg.last_name,''),
    'Pack ' || v_pkg.package_code || ' · +' || p_sessions::text || ' séance(s) · Motif : ' || trim(p_reason),
    jsonb_build_object('package_id', p_package_id, 'package_code', v_pkg.package_code,
                       'sessions', p_sessions, 'reason', trim(p_reason), 'performed_by', v_caller)
  );

  IF p_notify THEN
    PERFORM public.enqueue_recredit_notification(p_package_id, p_sessions, p_reason);
  END IF;

  RETURN jsonb_build_object('ok', true,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions,
    'total', v_pkg.total_sessions);
END;
$function$;

-- Annuler une inscription et recréditer le client
CREATE OR REPLACE FUNCTION public.admin_cancel_and_recredit(
  p_kind text,
  p_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_pkg_id uuid;
  v_status text;
  v_pkg public.client_packages;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  IF p_kind = 'visitor' THEN
    UPDATE public.reservations SET status = 'cancelled' WHERE id = p_id;
    RETURN jsonb_build_object('ok', true, 'credited', 0);
  ELSIF p_kind <> 'package' THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  SELECT package_id, status INTO v_pkg_id, v_status
    FROM public.package_bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;

  IF v_status = 'confirmed' THEN
    -- L'annulation restitue automatiquement 1 crédit (trigger sync_package_used_sessions)
    UPDATE public.package_bookings
       SET status = 'cancelled', updated_at = now()
     WHERE id = p_id;

    -- Traçabilité du motif école sur la dernière ligne d'historique générée
    UPDATE public.package_credit_history
       SET reason = 'Annulation école — ' || trim(p_reason),
           performed_by = v_caller
     WHERE id = (
       SELECT id FROM public.package_credit_history
        WHERE booking_id = p_id AND kind = 'cancellation'
        ORDER BY created_at DESC LIMIT 1
     );
  ELSE
    -- Déjà annulée : on recrédite explicitement
    PERFORM public.admin_recredit_package(v_pkg_id, 1, 'Annulation école — ' || trim(p_reason), false);
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE id = v_pkg_id;

  PERFORM public.enqueue_recredit_notification(v_pkg_id, 1, p_reason);

  PERFORM public.enqueue_admin_notification(
    'admin_credit', 'info',
    'Annulation + recrédit — ' || COALESCE(v_pkg.first_name,'') || ' ' || COALESCE(v_pkg.last_name,''),
    'Pack ' || v_pkg.package_code || ' · 1 séance recréditée · Motif : ' || trim(p_reason),
    jsonb_build_object('booking_id', p_id, 'package_id', v_pkg_id,
                       'reason', trim(p_reason), 'performed_by', v_caller)
  );

  RETURN jsonb_build_object('ok', true, 'credited', 1,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions);
END;
$function$;

-- Annuler une journée entière et recréditer tous les clients concernés
CREATE OR REPLACE FUNCTION public.admin_cancel_group_and_recredit(
  p_group_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_booking record;
  v_count int := 0;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  FOR v_booking IN
    SELECT id FROM public.package_bookings
     WHERE daily_group_id = p_group_id AND status = 'confirmed'
  LOOP
    PERFORM public.admin_cancel_and_recredit('package', v_booking.id, p_reason);
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.reservations
     SET status = 'cancelled'
   WHERE daily_group_id = p_group_id AND status <> 'cancelled';

  UPDATE public.daily_groups
     SET status = 'cancelled',
         notes = COALESCE(NULLIF(TRIM(COALESCE(notes,'') || E'\n' || 'Annulé: ' || trim(p_reason)), ''), notes),
         updated_at = now()
   WHERE id = p_group_id;

  RETURN jsonb_build_object('ok', true, 'recredited', v_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.enqueue_recredit_notification(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recredit_package(uuid, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_and_recredit(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_group_and_recredit(uuid, text) TO authenticated;
