CREATE OR REPLACE FUNCTION public.offer_waitlist_spot(p_date date, p_activity activity_type)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_free int; v_cand public.daily_waitlist; v_msg_id uuid := gen_random_uuid();
  v_html text; v_label text; v_token text;
  v_delay interval; v_delay_txt text; v_expires timestamptz;
BEGIN
  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  IF EXISTS (SELECT 1 FROM public.daily_waitlist
              WHERE date = p_date AND activity = p_activity AND status = 'offered') THEN
    RETURN jsonb_build_object('ok', true, 'offer_pending', true);
  END IF;

  v_free := public.waitlist_free_seats(p_date, p_activity, false);
  IF v_free < 1 THEN RETURN jsonb_build_object('ok', true, 'no_spot', true); END IF;

  SELECT * INTO v_cand FROM public.daily_waitlist
   WHERE date = p_date AND activity = p_activity AND status = 'waiting'
   ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'empty', true); END IF;

  IF GREATEST(v_cand.participants, 1) > v_free THEN
    RETURN jsonb_build_object('ok', true, 'no_spot', true, 'insufficient_seats', true);
  END IF;

  -- F-28-14 : place le jour même ou le lendemain (heure de Paris) -> 2 h pour confirmer, sinon 24 h.
  IF p_date <= (now() AT TIME ZONE 'Europe/Paris')::date + 1 THEN
    v_delay := interval '2 hours'; v_delay_txt := '2 h';
  ELSE
    v_delay := interval '24 hours'; v_delay_txt := '24 h';
  END IF;
  v_expires := now() + v_delay;

  UPDATE public.daily_waitlist
     SET status = 'offered', offered_at = now(), offer_expires_at = v_expires, updated_at = now()
   WHERE id = v_cand.id;

  v_token := public.issue_link_token('waitlist_offer', v_cand.id::text, v_expires);

  v_label := CASE p_activity::text
    WHEN 'kitesurf' THEN 'Kitesurf' WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil' WHEN 'foil_tracte' THEN 'Foil tracté'
    ELSE p_activity::text END;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Une place s''est libérée ! 🪁</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">Bonjour ', coalesce(v_cand.first_name,''),
    ', une place vient de se libérer en <strong>', v_label, '</strong> le <strong>', to_char(p_date,'DD/MM/YYYY'),
    '</strong>. Confirmez sous <strong>', v_delay_txt, '</strong> (avant ',
    to_char(v_expires AT TIME ZONE 'Europe/Paris','HH24"h"MI'), CASE WHEN v_delay_txt = '24 h' THEN ' demain' ELSE '' END,
    ') pour la réserver — passé ce délai, elle sera proposée au suivant.</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;text-align:center;">',
    '<a href="https://www.kitesurfpassion.fr/liste-attente/', v_token,
    '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Confirmer ma place</a>',
    '</td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0;color:#0F172A;font-size:13px;line-height:1.5;">⏰ Pour le spot et l''horaire, appelez le 06 72 71 69 05 si votre séance est aujourd''hui ; sinon ils vous seront communiqués la veille.</p>',
    '</div></td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">KiteSurf Passion — Hyères · 06 72 71 69 05</p>',
    '</td></tr></table></body></html>');

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(), 'message_id', v_msg_id,
    'template_name', 'waitlist_offer',
    'to', v_cand.email, 'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr', 'purpose', 'transactional',
    'label', 'waitlist_offer', 'queued_at', now(),
    'subject', CASE WHEN v_delay_txt = '2 h' THEN '⚡ ' ELSE '' END || 'Une place s''est libérée le ' || to_char(p_date,'DD/MM/YYYY') || ' — ' || v_label,
    'html', v_html,
    'text', 'Une place s''est libérée le ' || to_char(p_date,'DD/MM/YYYY') || ' (' || v_label
            || '). Confirmez sous ' || v_delay_txt || ' : https://www.kitesurfpassion.fr/liste-attente/' || v_token));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'waitlist_offer', v_cand.email, 'pending');

  RETURN jsonb_build_object('ok', true, 'offered_to', v_cand.email, 'expires_at', v_expires);
END;
$function$;