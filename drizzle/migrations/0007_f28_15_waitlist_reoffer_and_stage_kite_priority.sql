ALTER TABLE public.daily_waitlist ADD COLUMN IF NOT EXISTS offered_group_id uuid REFERENCES public.daily_groups(id) ON DELETE SET NULL;

-- Offre interne : p_group_id cible un groupe précis (place Kite libérée dans un groupe Stage).
CREATE OR REPLACE FUNCTION public.offer_waitlist_spot_in(p_date date, p_activity activity_type, p_group_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_free int; v_cand public.daily_waitlist; v_msg_id uuid := gen_random_uuid();
  v_html text; v_label text; v_token text; v_g public.daily_groups;
  v_delay interval; v_delay_txt text; v_expires timestamptz;
BEGIN
  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  IF EXISTS (SELECT 1 FROM public.daily_waitlist
              WHERE date = p_date AND activity = p_activity AND status = 'offered') THEN
    RETURN jsonb_build_object('ok', true, 'offer_pending', true);
  END IF;

  IF p_group_id IS NULL THEN
    v_free := public.waitlist_free_seats(p_date, p_activity, false);
  ELSE
    SELECT * INTO v_g FROM public.daily_groups WHERE id = p_group_id;
    IF NOT FOUND OR v_g.status <> 'open' THEN RETURN jsonb_build_object('ok', true, 'no_spot', true); END IF;
    v_free := v_g.max_participants
      - COALESCE((SELECT SUM(participants) FROM public.reservations WHERE daily_group_id = v_g.id AND status <> 'cancelled'),0)
      - COALESCE((SELECT COUNT(*) FROM public.package_bookings WHERE daily_group_id = v_g.id AND status = 'confirmed'),0);
  END IF;
  IF v_free < 1 THEN RETURN jsonb_build_object('ok', true, 'no_spot', true); END IF;

  SELECT * INTO v_cand FROM public.daily_waitlist
   WHERE date = p_date AND activity = p_activity AND status = 'waiting'
   ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'empty', true); END IF;

  IF GREATEST(v_cand.participants, 1) > v_free THEN
    RETURN jsonb_build_object('ok', true, 'no_spot', true, 'insufficient_seats', true);
  END IF;

  IF p_date <= (now() AT TIME ZONE 'Europe/Paris')::date + 1 THEN
    v_delay := interval '2 hours'; v_delay_txt := '2 h';
  ELSE
    v_delay := interval '24 hours'; v_delay_txt := '24 h';
  END IF;
  v_expires := now() + v_delay;

  UPDATE public.daily_waitlist
     SET status = 'offered', offered_at = now(), offer_expires_at = v_expires,
         offered_group_id = p_group_id, updated_at = now()
   WHERE id = v_cand.id;

  v_token := public.issue_link_token('waitlist_offer', v_cand.id::text, v_expires);

  v_label := CASE p_activity::text
    WHEN 'kitesurf' THEN 'Kitesurf' WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil' WHEN 'foil_tracte' THEN 'Foil tracté'
    WHEN 'stage_100_glisse' THEN 'Stage 100% Glisse'
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

CREATE OR REPLACE FUNCTION public.offer_waitlist_spot(p_date date, p_activity activity_type)
 RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.offer_waitlist_spot_in(p_date, p_activity, NULL) $$;

-- Place libérée dans un groupe : groupe Stage avec ≥1 participant Stage -> liste Kitesurf d'abord (F3-F4), puis liste Stage.
CREATE OR REPLACE FUNCTION public.notify_waitlist_for_group(p_group_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_dg public.daily_groups; v_r jsonb;
BEGIN
  SELECT * INTO v_dg FROM public.daily_groups WHERE id = p_group_id;
  IF NOT FOUND OR v_dg.status <> 'open' OR v_dg.date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true);
  END IF;

  IF v_dg.activity = 'stage_100_glisse'
     AND EXISTS (SELECT 1 FROM public.package_bookings WHERE daily_group_id = v_dg.id AND status = 'confirmed') THEN
    v_r := public.offer_waitlist_spot_in(v_dg.date, 'kitesurf', v_dg.id);
    IF v_r ? 'offered_to' THEN RETURN v_r; END IF;
  END IF;

  RETURN public.offer_waitlist_spot_in(v_dg.date, v_dg.activity, NULL);
END;
$function$;

CREATE OR REPLACE FUNCTION public.on_spot_freed_notify_waitlist()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.daily_group_id IS NULL THEN RETURN NEW; END IF;
  BEGIN
    PERFORM public.notify_waitlist_for_group(NEW.daily_group_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'waitlist offer failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

-- Cycle : les offres expirées sont reproposées immédiatement au suivant (même groupe cible le cas échéant).
CREATE OR REPLACE FUNCTION public.run_waitlist_cycle()
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r record; v_n int := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.run_waitlist_cycle')) THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'locked');
  END IF;

  FOR r IN
    WITH exp AS (
      UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
       WHERE status = 'offered' AND offer_expires_at < now()
      RETURNING offered_group_id)
    SELECT DISTINCT offered_group_id FROM exp WHERE offered_group_id IS NOT NULL
  LOOP
    BEGIN PERFORM public.notify_waitlist_for_group(r.offered_group_id);
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'waitlist reoffer failed: %', SQLERRM; END;
  END LOOP;

  FOR r IN SELECT DISTINCT date, activity FROM public.daily_waitlist
            WHERE status = 'waiting' AND date >= CURRENT_DATE
  LOOP
    PERFORM public.offer_waitlist_spot_in(r.date, r.activity, NULL);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'checked', v_n);
END;
$function$;

-- Confirmation : si l'offre cible un groupe Stage, verrou Stage puis Kitesurf (même ordre que find_or_create_compatible_group).
CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_w public.daily_waitlist; v_group_id uuid; v_res_id uuid; v_ip text; v_subject text;
  v_seats int; v_grp record; v_taken int;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('waitlist_offer_confirm', 'ip:' || v_ip, 10, interval '10 minutes') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

  v_subject := public.resolve_link_token('waitlist_offer', p_token);

  SELECT * INTO v_w FROM public.daily_waitlist
   WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
      OR (v_subject IS NULL AND offer_token_hash = public.code_access_hash(p_token::text))
   FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_token'); END IF;
  IF v_w.status = 'converted' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  IF v_w.status <> 'offered' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_active_offer'); END IF;
  IF v_w.offer_expires_at < now() THEN
    UPDATE public.daily_waitlist SET status = 'expired', updated_at = now() WHERE id = v_w.id;
    RETURN jsonb_build_object('ok', false, 'error', 'offer_expired');
  END IF;

  v_seats := GREATEST(v_w.participants, 1);

  IF v_w.offered_group_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.find_or_create_daily_group:' || v_w.date::text || ':stage_100_glisse'));
  END IF;
  PERFORM pg_advisory_xact_lock(
    hashtext('public.find_or_create_daily_group:' || v_w.date::text || ':' || v_w.activity::text));

  FOR v_grp IN
    SELECT * FROM public.daily_groups
     WHERE status = 'open'
       AND ((v_w.offered_group_id IS NOT NULL AND id = v_w.offered_group_id)
         OR (date = v_w.date AND activity = v_w.activity))
     ORDER BY (id = v_w.offered_group_id) DESC NULLS LAST, group_index ASC
     FOR UPDATE
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_grp.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_grp.id AND status = 'confirmed'),0)
    INTO v_taken;
    IF (v_taken + v_seats) <= v_grp.max_participants THEN
      v_group_id := v_grp.id; EXIT;
    END IF;
  END LOOP;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_capacity');
  END IF;

  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, notes, client_activity
  ) VALUES (
    v_group_id, v_w.first_name, v_w.last_name, v_w.email, v_w.phone,
    'debutant', v_seats, 'confirmed', 'Issu de la liste d''attente', v_w.activity
  ) RETURNING id INTO v_res_id;

  UPDATE public.daily_waitlist SET status = 'converted', updated_at = now() WHERE id = v_w.id;

  RETURN jsonb_build_object('ok', true, 'reservation_id', v_res_id, 'daily_group_id', v_group_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.offer_waitlist_spot_in(date, activity_type, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_waitlist_for_group(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.offer_waitlist_spot_in(date, activity_type, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_waitlist_for_group(uuid) TO service_role;