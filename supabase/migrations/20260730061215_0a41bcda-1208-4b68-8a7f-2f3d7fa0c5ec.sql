CREATE OR REPLACE FUNCTION public.enqueue_credit_expiry_notices()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_stage record;
  v_row record;
  v_html text;
  v_subject text;
  v_msg_id uuid;
  v_sent int := 0;
  v_skipped int := 0;
  v_label text;
BEGIN
  FOR v_stage IN SELECT s.days, s.action FROM (VALUES (30,'notified_30'),(7,'notified_7'),(0,'notified_0')) AS s(days, action)
  LOOP
    FOR v_row IN
      SELECT cp.id AS package_id, cp.email, cp.first_name, cp.package_code, cp.activity,
             COUNT(c.id) AS nb, MIN(c.expires_at) AS first_exp,
             array_agg(c.id) AS credit_ids,
             CASE v_stage.days
               WHEN 30 THEN COALESCE(pr.remind_30, true)
               WHEN 7  THEN COALESCE(pr.remind_7, true)
               ELSE COALESCE(pr.remind_0, true)
             END AS enabled
        FROM public.session_credits c
        JOIN public.client_packages cp ON cp.id = c.package_id
        LEFT JOIN public.credit_reminder_preferences pr ON pr.package_id = cp.id
       WHERE c.status = 'available'
         AND c.expires_at::date = (CURRENT_DATE + v_stage.days)
         AND cp.email IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.credit_audit_log a
            WHERE a.credit_id = c.id AND a.action = v_stage.action)
       GROUP BY cp.id, cp.email, cp.first_name, cp.package_code, cp.activity,
                pr.remind_30, pr.remind_7, pr.remind_0
    LOOP
      IF NOT v_row.enabled THEN
        INSERT INTO public.credit_audit_log (credit_id, package_id, action, reason, details)
        SELECT unnest(v_row.credit_ids), v_row.package_id, v_stage.action,
               'Rappel désactivé par le client',
               jsonb_build_object('days', v_stage.days, 'skipped', true);
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

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
        '<tr><td style="padding:0 25px 24px;text-align:center;">',
        '<a href="https://www.kitesurfpassion.fr/mon-espace/', v_row.package_code, '#rappels" style="font-size:12px;color:#64748B;text-decoration:underline;">Gérer mes rappels d''expiration</a>',
        '</td></tr>',
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

  RETURN jsonb_build_object('emails', v_sent, 'skipped', v_skipped);
END;
$fn$;