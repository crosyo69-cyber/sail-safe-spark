CREATE OR REPLACE FUNCTION public.enqueue_booking_confirmation(p_booking_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_date_val date; v_activity_text text; v_activity_label text; v_date_str text;
  v_remaining int; v_html text; v_subject text; v_callout text; v_text text;
  v_last_minute boolean; v_group_index int;
BEGIN
  SELECT cp.* INTO v_pkg FROM public.package_bookings pb
    JOIN public.client_packages cp ON cp.id = pb.package_id WHERE pb.id = p_booking_id;
  IF NOT FOUND OR v_pkg.email IS NULL THEN RETURN; END IF;

  SELECT dg.date, dg.activity::text, dg.group_index INTO v_date_val, v_activity_text, v_group_index
    FROM public.package_bookings pb LEFT JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
   WHERE pb.id = p_booking_id;
  IF v_date_val IS NULL THEN RETURN; END IF;

  v_activity_label := CASE v_activity_text
    WHEN 'kitesurf' THEN 'Kitesurf' WHEN 'wingfoil' THEN 'Wingfoil' WHEN 'pumpfoil' THEN 'Pumpfoil'
    WHEN 'foil_tracte' THEN 'Foil tracté' WHEN 'stage_100_glisse' THEN 'Stage 100% Glisse'
    ELSE v_activity_text END;
  v_date_str := to_char(v_date_val, 'DD/MM/YYYY');
  v_remaining := v_pkg.total_sessions - v_pkg.used_sessions;
  v_last_minute := v_date_val = (now() AT TIME ZONE 'Europe/Paris')::date;

  IF v_last_minute THEN
    v_subject := '[Dernière minute] Votre session ' || v_activity_label || ' aujourd''hui — KiteSurf Passion';
    v_callout := concat(
      '<div style="background:#FFEDD5;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
      '<p style="margin:0 0 6px;color:#0F172A;font-size:15px;font-weight:bold;">⚡ Inscription le jour même</p>',
      '<p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.5;">',
      'Le planning de la journée est déjà fixé. Appelez Yoanne dès maintenant pour connaître le spot retenu et votre heure de rendez-vous.</p>',
      '<p style="margin:0;"><a href="tel:+33672716905" style="display:inline-block;background:#F97316;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;font-size:16px;">📞 06 72 71 69 05</a></p>',
      '</div>');
    v_text := 'Bonjour ' || coalesce(v_pkg.first_name,'') || ', votre session ' || v_activity_label
      || ' d''aujourd''hui (' || v_date_str || ') est confirmée. Appelez Yoanne au 06 72 71 69 05 pour connaître le spot et l''horaire de départ.';
  ELSE
    v_subject := 'Réservation confirmée — ' || v_activity_label || ' du ' || v_date_str;
    v_callout := concat(
      '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
      '<p style="margin:0 0 6px;color:#0F172A;font-size:14px;font-weight:bold;">⏰ Horaire communiqué la veille</p>',
      '<p style="margin:0;color:#64748B;font-size:13px;line-height:1.5;">',
      'L''heure exacte de rendez-vous et le spot sont déterminés la veille selon les conditions ',
      'météorologiques (vent, mer, sécurité). Nous vous contacterons directement.</p></div>');
    v_text := 'Bonjour ' || coalesce(v_pkg.first_name,'') || ', votre journée ' || v_activity_label
      || ' du ' || v_date_str || ' est confirmée. L''horaire vous sera communiqué la veille.';
  END IF;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(v_pkg.first_name,''), ', votre journée est confirmée 🪁</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">Nous avons bien enregistré votre inscription.</p></td></tr>',
    CASE WHEN v_last_minute THEN concat('<tr><td style="padding:0 25px 16px;">', v_callout, '</td></tr>') ELSE '' END,
    '<tr><td style="padding:0 25px 16px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;"><tr><td style="padding:20px;">',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Activité</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:18px;font-weight:bold;">', v_activity_label, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date</p>',
    '<p style="margin:0 0 14px;color:#0F172A;font-size:16px;font-weight:600;">', v_date_str, CASE WHEN v_last_minute THEN ' (aujourd''hui)' ELSE '' END, '</p>',
    '<p style="margin:0 0 6px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Journées restantes</p>',
    '<p style="margin:0;color:#0891B2;font-size:24px;font-weight:bold;">', v_remaining, ' / ', v_pkg.total_sessions, '</p>',
    '</td></tr></table></td></tr>',
    CASE WHEN v_last_minute THEN '' ELSE concat('<tr><td style="padding:0 25px 16px;">', v_callout, '</td></tr>') END,
    '<tr><td style="padding:0 25px 32px;"><p style="font-size:13px;color:#94A3B8;line-height:1.6;margin:0;">',
    'KiteSurf Passion — Hyères · 06 72 71 69 05</p></td></tr></table></body></html>');

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(), 'message_id', gen_random_uuid(),
    'template_name', CASE WHEN v_last_minute THEN 'booking_confirmation_last_minute' ELSE 'booking_confirmation' END,
    'to', v_pkg.email, 'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr', 'purpose', 'transactional',
    'label', 'booking_confirmation', 'queued_at', now(),
    'subject', v_subject, 'html', v_html, 'text', v_text));

  IF v_last_minute THEN
    PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
      'run_id', gen_random_uuid(), 'message_id', 'last-minute-admin-' || p_booking_id::text,
      'template_name', 'last_minute_admin_alert',
      'to', 'crosyo69@gmail.com', 'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
      'sender_domain', 'kitesurfpassion.fr', 'purpose', 'transactional',
      'label', 'last_minute_admin_alert', 'queued_at', now(),
      'subject', '🚨 DERNIÈRE MINUTE : ' || coalesce(v_pkg.first_name,'') || ' ' || coalesce(v_pkg.last_name,'') || ' inscrit(e) AUJOURD''HUI (' || v_activity_label || ')',
      'html', concat(
        '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
        '<body style="margin:0;padding:24px;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;color:#0F172A;">',
        '<h1 style="font-size:20px;margin:0 0 16px;">🚨 Inscription de dernière minute</h1>',
        '<p style="font-size:16px;margin:0 0 8px;"><strong>', coalesce(v_pkg.first_name,''), ' ', coalesce(v_pkg.last_name,''), '</strong></p>',
        '<p style="font-size:15px;margin:0 0 8px;">', v_activity_label, ' — aujourd''hui ', v_date_str, ' — groupe #', coalesce(v_group_index::text,'?'), '</p>',
        '<p style="font-size:15px;margin:0 0 8px;">Pack ', coalesce(v_pkg.package_code,''), ' · ', v_pkg.email, '</p>',
        CASE WHEN v_pkg.phone IS NOT NULL AND v_pkg.phone <> '' THEN
          concat('<p style="margin:16px 0 0;"><a href="tel:', regexp_replace(v_pkg.phone,'[^0-9+]','','g'),
                 '" style="display:inline-block;background:#F97316;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">📞 Appeler ', v_pkg.phone, '</a></p>')
        ELSE '<p style="color:#64748B;">Pas de téléphone renseigné.</p>' END,
        '</body></html>'),
      'text', 'Dernière minute : ' || coalesce(v_pkg.first_name,'') || ' ' || coalesce(v_pkg.last_name,'')
        || ' — ' || v_activity_label || ' aujourd''hui ' || v_date_str || ' — tél. ' || coalesce(v_pkg.phone,'non renseigné')));
  END IF;
END;
$function$;