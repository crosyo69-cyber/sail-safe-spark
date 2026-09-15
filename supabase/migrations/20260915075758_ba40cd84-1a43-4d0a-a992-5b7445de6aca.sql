-- F-27-02 HARDENING (P2 uniquement)
-- Helper : places réellement disponibles pour (date, activité).
-- p_include_potential = true  -> inclut la capacité d'un groupe qui pourrait
--                               encore être créé par le parcours payant nominal
--                               (utilisé uniquement pour l'ÉLIGIBILITÉ waitlist).
-- p_include_potential = false -> uniquement les places libres dans les groupes
--                               OUVERTS EXISTANTS (utilisé pour offre/conversion).
CREATE OR REPLACE FUNCTION public.waitlist_free_seats(
  p_date date,
  p_activity activity_type,
  p_include_potential boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_groups int;
  v_free int;
BEGIN
  SELECT COUNT(*),
         COALESCE(SUM(dg.max_participants - (
            COALESCE((SELECT SUM(participants) FROM public.reservations
                       WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
          + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                       WHERE daily_group_id = dg.id AND status = 'confirmed'),0))), 0)
    INTO v_groups, v_free
    FROM public.daily_groups dg
   WHERE dg.date = p_date AND dg.activity = p_activity AND dg.status = 'open';

  IF p_include_potential AND v_groups = 0 THEN
    RETURN public.default_max_participants(p_activity);
  END IF;

  RETURN GREATEST(COALESCE(v_free, 0), 0);
END;
$function$;

REVOKE ALL ON FUNCTION public.waitlist_free_seats(date, activity_type, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waitlist_free_seats(date, activity_type, boolean) TO service_role;

-- F-27-02-01 : éligibilité + bornes serveur sur p_participants.
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_date date, p_activity activity_type, p_first_name text, p_last_name text,
  p_email text, p_phone text, p_participants integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ip text;
  v_email text;
  v_cap int;
  v_part int;
  v_free int;
BEGIN
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok', false, 'error', 'date_in_past'); END IF;
  IF p_email IS NULL OR position('@' in p_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  v_email := lower(btrim(p_email));
  v_ip := public.code_access_client_ip();

  IF v_ip IS NOT NULL THEN
    IF NOT public.public_rate_guard('waitlist_join', 'ip:' || v_ip, 5, interval '10 minutes') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;
    IF NOT public.public_rate_guard('waitlist_join_email', 'email:' || v_email, 3, interval '15 minutes') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;
  END IF;

  -- F-27-02-02 : bornes serveur strictes (le frontend n'est pas une protection).
  v_cap := public.default_max_participants(p_activity);
  IF v_cap IS NULL OR v_cap < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_request');
  END IF;

  v_part := p_participants;
  IF v_part IS NULL OR v_part < 1 OR v_part > v_cap THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_participants');
  END IF;

  -- F-27-02-01 : la waitlist n'est ouverte que si la journée ne peut PAS
  -- satisfaire la demande par le parcours nominal (avec acompte).
  v_free := public.waitlist_free_seats(p_date, p_activity, true);
  IF v_free >= v_part THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_eligible');
  END IF;

  INSERT INTO public.daily_waitlist(date, activity, first_name, last_name, email, phone, participants)
  VALUES (p_date, p_activity, p_first_name, p_last_name, v_email, p_phone, v_part)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- F-27-02-02 : une offre uniquement si les places réellement libérées
-- couvrent la demande du candidat FIFO.
CREATE OR REPLACE FUNCTION public.offer_waitlist_spot(p_date date, p_activity activity_type)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_free int;
  v_cand public.daily_waitlist;
  v_msg_id uuid := gen_random_uuid();
  v_html text;
  v_label text;
  v_token text;
BEGIN
  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  IF EXISTS (SELECT 1 FROM public.daily_waitlist
              WHERE date = p_date AND activity = p_activity AND status = 'offered') THEN
    RETURN jsonb_build_object('ok', true, 'offer_pending', true);
  END IF;

  -- Places libres dans les groupes OUVERTS EXISTANTS uniquement.
  v_free := public.waitlist_free_seats(p_date, p_activity, false);
  IF v_free < 1 THEN RETURN jsonb_build_object('ok', true, 'no_spot', true); END IF;

  SELECT * INTO v_cand FROM public.daily_waitlist
   WHERE date = p_date AND activity = p_activity AND status = 'waiting'
   ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'empty', true); END IF;

  -- F-27-02-02 : pas d'offre si les places libérées ne couvrent pas la demande.
  IF GREATEST(v_cand.participants, 1) > v_free THEN
    RETURN jsonb_build_object('ok', true, 'no_spot', true, 'insufficient_seats', true);
  END IF;

  UPDATE public.daily_waitlist
     SET status = 'offered', offered_at = now(), offer_expires_at = now() + interval '24 hours', updated_at = now()
   WHERE id = v_cand.id;

  v_token := public.issue_link_token('waitlist_offer', v_cand.id::text, now() + interval '24 hours');

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
    '</strong>. Confirmez sous 24 h pour la réserver — passé ce délai, elle sera proposée au suivant.</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;text-align:center;">',
    '<a href="https://www.kitesurfpassion.fr/liste-attente/', v_token,
    '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Confirmer ma place</a>',
    '</td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0;color:#0F172A;font-size:13px;line-height:1.5;">⏰ Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.</p>',
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
    'subject', 'Une place s''est libérée le ' || to_char(p_date,'DD/MM/YYYY') || ' — ' || v_label,
    'html', v_html,
    'text', 'Une place s''est libérée le ' || to_char(p_date,'DD/MM/YYYY') || ' (' || v_label
            || '). Confirmez sous 24 h : https://www.kitesurfpassion.fr/liste-attente/' || v_token
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'waitlist_offer', v_cand.email, 'pending');

  RETURN jsonb_build_object('ok', true, 'offered_to', v_cand.email);
END;
$function$;

-- F-27-02-02 : la conversion ne consomme QUE la capacité d'un groupe existant.
-- Plus aucun appel à find_or_create_daily_group depuis ce chemin.
CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_w public.daily_waitlist;
  v_group_id uuid;
  v_res_id uuid;
  v_ip text;
  v_subject text;
  v_seats int;
  v_grp record;
  v_taken int;
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

  -- Même clé de verrou que F-26-02 : sérialise avec find_or_create_daily_group.
  PERFORM pg_advisory_xact_lock(
    hashtext('public.find_or_create_daily_group:' || v_w.date::text || ':' || v_w.activity::text)
  );

  -- Sélection d'un groupe EXISTANT disposant réellement de la capacité.
  FOR v_grp IN
    SELECT * FROM public.daily_groups
     WHERE date = v_w.date AND activity = v_w.activity AND status = 'open'
     ORDER BY group_index ASC
     FOR UPDATE
  LOOP
    SELECT
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = v_grp.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = v_grp.id AND status = 'confirmed'),0)
    INTO v_taken;

    IF (v_taken + v_seats) <= v_grp.max_participants THEN
      v_group_id := v_grp.id;
      EXIT;
    END IF;
  END LOOP;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_capacity');
  END IF;

  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, notes
  ) VALUES (
    v_group_id, v_w.first_name, v_w.last_name, v_w.email, v_w.phone,
    'debutant', v_seats, 'confirmed', 'Issu de la liste d''attente'
  ) RETURNING id INTO v_res_id;

  UPDATE public.daily_waitlist SET status = 'converted', updated_at = now() WHERE id = v_w.id;

  RETURN jsonb_build_object('ok', true, 'reservation_id', v_res_id, 'daily_group_id', v_group_id);
END;
$function$;