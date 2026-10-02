-- ============ PHASE A : journal enrichi + portefeuille ============
ALTER TABLE public.package_credit_history
  ADD COLUMN IF NOT EXISTS activity activity_type,
  ADD COLUMN IF NOT EXISTS daily_group_id uuid,
  ADD COLUMN IF NOT EXISTS action text;

ALTER TABLE public.package_credit_history
  DROP CONSTRAINT IF EXISTS package_credit_history_kind_check;
ALTER TABLE public.package_credit_history
  ADD CONSTRAINT package_credit_history_kind_check
  CHECK (kind = ANY (ARRAY['initial','booking','cancellation','admin_credit','admin_debit','report','group_cancel']));

-- historique append-only : aucune suppression / modification
REVOKE UPDATE, DELETE ON public.package_credit_history FROM authenticated, anon;
GRANT SELECT, INSERT ON public.package_credit_history TO authenticated;
GRANT ALL ON public.package_credit_history TO service_role;

CREATE OR REPLACE VIEW public.client_credit_wallet
WITH (security_invoker = true) AS
SELECT
  cp.id AS package_id,
  cp.package_code,
  cp.email,
  cp.first_name,
  cp.last_name,
  cp.activity,
  cp.package_type,
  cp.status,
  cp.expires_at,
  cp.created_at,
  COALESCE((SELECT SUM(h.delta) FROM public.package_credit_history h
             WHERE h.package_id = cp.id AND h.kind = 'admin_credit'), 0)::int AS recredited,
  (cp.total_sessions - COALESCE((SELECT SUM(h.delta) FROM public.package_credit_history h
             WHERE h.package_id = cp.id AND h.kind = 'admin_credit'), 0))::int AS purchased,
  cp.used_sessions AS consumed,
  cp.total_sessions,
  (cp.total_sessions - cp.used_sessions)::int AS remaining
FROM public.client_packages cp;

GRANT SELECT ON public.client_credit_wallet TO authenticated;
GRANT ALL ON public.client_credit_wallet TO service_role;

CREATE OR REPLACE FUNCTION public.get_wallet_by_code(p_code text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'wallet', COALESCE((
      SELECT jsonb_agg(to_jsonb(w) - 'email')
      FROM public.client_credit_wallet w
      WHERE w.package_code = p_code
    ), '[]'::jsonb),
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', h.id, 'delta', h.delta, 'kind', h.kind, 'action', h.action,
        'reason', h.reason, 'activity', h.activity,
        'balance_after', h.balance_after, 'created_at', h.created_at
      ) ORDER BY h.created_at DESC)
      FROM public.package_credit_history h
      JOIN public.client_packages cp ON cp.id = h.package_id
      WHERE cp.package_code = p_code
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_search_wallets(p_query text DEFAULT NULL, p_activity text DEFAULT NULL, p_season text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(w) ORDER BY w.created_at DESC), '[]'::jsonb) INTO v
  FROM public.client_credit_wallet w
  WHERE (p_query IS NULL OR p_query = '' OR
         w.package_code ILIKE '%'||p_query||'%' OR w.email ILIKE '%'||p_query||'%' OR
         (coalesce(w.first_name,'')||' '||coalesce(w.last_name,'')) ILIKE '%'||p_query||'%')
    AND (p_activity IS NULL OR p_activity = '' OR w.activity::text = p_activity)
    AND (p_season IS NULL OR p_season = '' OR to_char(w.created_at, 'YYYY') = p_season);
  RETURN v;
END;
$$;

-- ============ PHASE D (partie SQL) : emails ============
CREATE OR REPLACE FUNCTION public.enqueue_reschedule_notification(p_kind text, p_email text, p_first_name text, p_activity text, p_old_date date, p_new_date date, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_msg_id uuid := gen_random_uuid();
  v_label text;
  v_html text;
BEGIN
  IF p_email IS NULL THEN RETURN; END IF;
  v_label := CASE p_activity
    WHEN 'kitesurf' THEN 'Kitesurf' WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil' WHEN 'foil_tracte' THEN 'Foil tracté'
    WHEN 'stage_100_glisse' THEN 'Stage 100% Glisse' ELSE p_activity END;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(p_first_name,''), ', votre séance a été reportée 🪁</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">Votre séance de <strong>', v_label,
    '</strong> initialement prévue le <strong>', to_char(p_old_date,'DD/MM/YYYY'), '</strong> est désormais programmée le <strong>',
    to_char(p_new_date,'DD/MM/YYYY'), '</strong>', CASE WHEN p_reason IS NOT NULL AND length(trim(p_reason))>0 THEN ' (' || trim(p_reason) || ')' ELSE '' END,
    '. Votre paiement reste valable, rien d''autre ne change.</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0;color:#0F172A;font-size:13px;line-height:1.5;">⏰ Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.</p>',
    '</div></td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">KiteSurf Passion — Hyères · 06 72 71 69 05</p>',
    '</td></tr></table></body></html>');

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(), 'message_id', v_msg_id,
    'template_name', 'booking_rescheduled',
    'to', p_email, 'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr', 'purpose', 'transactional',
    'label', 'booking_rescheduled', 'queued_at', now(),
    'subject', 'Votre séance ' || v_label || ' est reportée au ' || to_char(p_new_date,'DD/MM/YYYY'),
    'html', v_html,
    'text', 'Votre séance ' || v_label || ' du ' || to_char(p_old_date,'DD/MM/YYYY') || ' est reportée au '
            || to_char(p_new_date,'DD/MM/YYYY') || '. Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.'
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'booking_rescheduled', p_email, 'pending');
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_day_cancelled_notification(p_email text, p_first_name text, p_activity text, p_date date, p_reason text, p_recredited boolean, p_code text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_msg_id uuid := gen_random_uuid();
  v_label text;
  v_html text;
  v_cta text;
BEGIN
  IF p_email IS NULL THEN RETURN; END IF;
  v_label := CASE p_activity
    WHEN 'kitesurf' THEN 'Kitesurf' WHEN 'wingfoil' THEN 'Wingfoil'
    WHEN 'pumpfoil' THEN 'Pumpfoil' WHEN 'foil_tracte' THEN 'Foil tracté'
    WHEN 'stage_100_glisse' THEN 'Stage 100% Glisse' ELSE p_activity END;

  v_cta := CASE WHEN p_code IS NOT NULL
    THEN '<a href="https://www.kitesurfpassion.fr/mon-espace/' || p_code || '" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Choisir une nouvelle date</a>'
    ELSE '<a href="https://www.kitesurfpassion.fr/reserver" style="display:inline-block;background:#F97316;color:#fff;font-weight:bold;border-radius:10px;padding:12px 24px;text-decoration:none;">Choisir une nouvelle date</a>' END;

  v_html := concat(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>',
    '<body style="margin:0;padding:0;background:#fff;font-family:Montserrat,Inter,Arial,sans-serif;">',
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">',
    '<tr><td style="background:#0F172A;padding:24px;text-align:center;">',
    '<img src="https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="KiteSurf Passion" width="180" /></td></tr>',
    '<tr><td style="padding:32px 25px 0;">',
    '<h1 style="font-size:22px;color:#0F172A;margin:0 0 16px;">Bonjour ', coalesce(p_first_name,''), ', la journée du ',
    to_char(p_date,'DD/MM/YYYY'), ' est annulée</h1>',
    '<p style="font-size:15px;color:#64748B;line-height:1.6;margin:0 0 16px;">Votre séance de <strong>', v_label,
    '</strong> ne pourra pas avoir lieu', CASE WHEN p_reason IS NOT NULL AND length(trim(p_reason))>0 THEN ' (' || trim(p_reason) || ')' ELSE '' END, '. ',
    CASE WHEN p_recredited THEN 'Aucun paiement n''est perdu : votre séance a été recréditée sur votre compte.'
         ELSE 'Aucun paiement n''est perdu : nous vous recontactons pour convenir d''une nouvelle date.' END,
    '</p></td></tr>',
    '<tr><td style="padding:0 25px 24px;text-align:center;">', v_cta, '</td></tr>',
    '<tr><td style="padding:0 25px 24px;">',
    '<div style="background:#FEF3C7;border-left:4px solid #F97316;padding:14px 16px;border-radius:6px;">',
    '<p style="margin:0;color:#0F172A;font-size:13px;line-height:1.5;">⏰ Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.</p>',
    '</div></td></tr>',
    '<tr><td style="background:#0F172A;padding:16px 25px;text-align:center;">',
    '<p style="font-size:12px;color:#94a3b8;margin:0;">KiteSurf Passion — Hyères · 06 72 71 69 05</p>',
    '</td></tr></table></body></html>');

  PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
    'run_id', gen_random_uuid(), 'message_id', v_msg_id,
    'template_name', 'day_cancelled',
    'to', p_email, 'from', 'KiteSurf Passion <noreply@kitesurfpassion.fr>',
    'sender_domain', 'kitesurfpassion.fr', 'purpose', 'transactional',
    'label', 'day_cancelled', 'queued_at', now(),
    'subject', 'Journée du ' || to_char(p_date,'DD/MM/YYYY') || ' annulée — ' || v_label,
    'html', v_html,
    'text', 'La journée du ' || to_char(p_date,'DD/MM/YYYY') || ' (' || v_label || ') est annulée. '
            || 'Les horaires seront communiqués la veille par téléphone selon les conditions météorologiques.'
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'day_cancelled', p_email, 'pending');
END;
$$;

-- ============ PHASE B : report d'une réservation ============
CREATE OR REPLACE FUNCTION public.admin_reschedule_booking(p_kind text, p_id uuid, p_new_date date, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_old_group public.daily_groups;
  v_new_group_id uuid;
  v_seats int := 1;
  v_email text; v_first text; v_pkg public.client_packages;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_new_date IS NULL OR p_new_date < CURRENT_DATE THEN RAISE EXCEPTION 'invalid_date'; END IF;

  IF p_kind = 'visitor' THEN
    SELECT dg.* INTO v_old_group FROM public.reservations r
      JOIN public.daily_groups dg ON dg.id = r.daily_group_id WHERE r.id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'reservation_not_found'; END IF;
    SELECT r.participants, r.email, r.first_name INTO v_seats, v_email, v_first
      FROM public.reservations r WHERE r.id = p_id;
    v_new_group_id := public.find_or_create_daily_group(p_new_date, v_old_group.activity, GREATEST(v_seats,1));
    UPDATE public.reservations SET daily_group_id = v_new_group_id, updated_at = now() WHERE id = p_id;
  ELSIF p_kind = 'package' THEN
    SELECT dg.* INTO v_old_group FROM public.package_bookings pb
      JOIN public.daily_groups dg ON dg.id = pb.daily_group_id WHERE pb.id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;
    SELECT cp.* INTO v_pkg FROM public.package_bookings pb
      JOIN public.client_packages cp ON cp.id = pb.package_id WHERE pb.id = p_id;
    v_email := v_pkg.email; v_first := v_pkg.first_name;
    v_new_group_id := public.find_or_create_daily_group(p_new_date, v_old_group.activity, 1);
    UPDATE public.package_bookings SET daily_group_id = v_new_group_id, updated_at = now() WHERE id = p_id;

    INSERT INTO public.package_credit_history
      (package_id, delta, kind, action, reason, booking_id, performed_by, balance_after, activity, daily_group_id)
    VALUES (v_pkg.id, 0, 'report', 'report',
            COALESCE(NULLIF(trim(p_reason),''), 'Report de séance') || ' — ' ||
            to_char(v_old_group.date,'DD/MM/YYYY') || ' → ' || to_char(p_new_date,'DD/MM/YYYY'),
            p_id, auth.uid(), v_pkg.total_sessions - v_pkg.used_sessions,
            v_old_group.activity, v_new_group_id);
  ELSE
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  PERFORM public.enqueue_reschedule_notification(p_kind, v_email, v_first,
    v_old_group.activity::text, v_old_group.date, p_new_date, p_reason);

  PERFORM public.enqueue_admin_notification(
    'booking_rescheduled', 'info',
    'Réservation reportée — ' || v_old_group.activity::text,
    coalesce(v_email,'?') || ' · ' || to_char(v_old_group.date,'DD/MM/YYYY') || ' → ' || to_char(p_new_date,'DD/MM/YYYY'),
    jsonb_build_object('kind', p_kind, 'id', p_id, 'new_date', p_new_date, 'reason', p_reason));

  RETURN jsonb_build_object('ok', true, 'daily_group_id', v_new_group_id);
END;
$$;

-- ============ PHASE C : annulation d'une journée entière ============
CREATE OR REPLACE FUNCTION public.admin_cancel_day(p_date date, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_groups int := 0;
  v_recredited int := 0;
  v_visitors int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  -- Packs : annulation + recrédit (le trigger sync_package_used_sessions rend le crédit)
  FOR r IN
    SELECT pb.id AS booking_id, pb.package_id, dg.activity, dg.id AS group_id,
           cp.email, cp.first_name, cp.package_code
      FROM public.package_bookings pb
      JOIN public.daily_groups dg ON dg.id = pb.daily_group_id
      JOIN public.client_packages cp ON cp.id = pb.package_id
     WHERE dg.date = p_date AND pb.status = 'confirmed'
     FOR UPDATE OF pb
  LOOP
    UPDATE public.package_bookings SET status = 'cancelled', updated_at = now()
     WHERE id = r.booking_id AND status = 'confirmed';

    INSERT INTO public.package_credit_history
      (package_id, delta, kind, action, reason, booking_id, performed_by, balance_after, activity, daily_group_id)
    SELECT r.package_id, 0, 'group_cancel', 'group_cancel',
           'Journée annulée (' || trim(p_reason) || ') — ' || to_char(p_date,'DD/MM/YYYY'),
           r.booking_id, auth.uid(), cp.total_sessions - cp.used_sessions, r.activity, r.group_id
      FROM public.client_packages cp WHERE cp.id = r.package_id;

    PERFORM public.enqueue_day_cancelled_notification(
      r.email, r.first_name, r.activity::text, p_date, p_reason, true, r.package_code);
    v_recredited := v_recredited + 1;
  END LOOP;

  -- Visiteurs
  FOR r IN
    SELECT res.id, res.email, res.first_name, dg.activity
      FROM public.reservations res
      JOIN public.daily_groups dg ON dg.id = res.daily_group_id
     WHERE dg.date = p_date AND res.status <> 'cancelled'
     FOR UPDATE OF res
  LOOP
    UPDATE public.reservations SET status = 'cancelled', updated_at = now() WHERE id = r.id;
    PERFORM public.enqueue_day_cancelled_notification(
      r.email, r.first_name, r.activity::text, p_date, p_reason, false, NULL);
    v_visitors := v_visitors + 1;
  END LOOP;

  UPDATE public.daily_groups
     SET status = 'cancelled',
         notes = COALESCE(NULLIF(TRIM(COALESCE(notes,'') || E'\n' || 'Journée annulée: ' || trim(p_reason)), ''), notes),
         updated_at = now()
   WHERE date = p_date AND status <> 'cancelled';
  GET DIAGNOSTICS v_groups = ROW_COUNT;

  PERFORM public.enqueue_admin_notification(
    'day_cancelled', 'warning',
    'Journée annulée — ' || to_char(p_date,'DD/MM/YYYY'),
    v_groups::text || ' groupe(s) · ' || v_recredited::text || ' pack(s) recrédité(s) · '
      || v_visitors::text || ' visiteur(s) · Motif : ' || trim(p_reason),
    jsonb_build_object('date', p_date, 'reason', trim(p_reason)),
    'day_cancelled:' || p_date::text);

  RETURN jsonb_build_object('ok', true, 'groups', v_groups,
    'packages_recredited', v_recredited, 'visitors_cancelled', v_visitors);
END;
$$;

-- ============ PHASE F : indicateurs admin ============
CREATE OR REPLACE FUNCTION public.admin_credit_stats(p_start date, p_end date)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT jsonb_build_object(
    'credits_used', COALESCE((SELECT SUM(-delta) FROM public.package_credit_history
                               WHERE kind IN ('booking','admin_debit')
                                 AND created_at::date BETWEEN p_start AND p_end), 0),
    'credits_recredited', COALESCE((SELECT SUM(delta) FROM public.package_credit_history
                               WHERE kind IN ('cancellation','admin_credit')
                                 AND created_at::date BETWEEN p_start AND p_end), 0),
    'credits_remaining', COALESCE((SELECT SUM(total_sessions - used_sessions)
                                     FROM public.client_packages WHERE status = 'active'), 0),
    'weather_cancellations', COALESCE((SELECT COUNT(*) FROM public.package_credit_history
                               WHERE kind IN ('admin_credit','group_cancel')
                                 AND (lower(reason) LIKE '%vent%' OR lower(reason) LIKE '%météo%'
                                      OR lower(reason) LIKE '%meteo%' OR lower(reason) LIKE '%orage%')
                                 AND created_at::date BETWEEN p_start AND p_end), 0),
    'reports', COALESCE((SELECT COUNT(*) FROM public.package_credit_history
                               WHERE kind = 'report' AND created_at::date BETWEEN p_start AND p_end), 0),
    'days_cancelled', COALESCE((SELECT COUNT(DISTINCT date) FROM public.daily_groups
                               WHERE status = 'cancelled' AND date BETWEEN p_start AND p_end), 0)
  ) INTO v;
  RETURN v;
END;
$$;

-- ============ PHASE H : liste d'attente ============
CREATE TABLE IF NOT EXISTS public.daily_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  activity activity_type NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  participants int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  offer_token uuid NOT NULL DEFAULT gen_random_uuid(),
  offered_at timestamptz,
  offer_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_waitlist_status_chk CHECK (status IN ('waiting','offered','converted','expired','cancelled'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_waitlist TO authenticated;
GRANT INSERT ON public.daily_waitlist TO anon;
GRANT ALL ON public.daily_waitlist TO service_role;

ALTER TABLE public.daily_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.daily_waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.daily_waitlist
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage waitlist" ON public.daily_waitlist;
CREATE POLICY "Admins manage waitlist" ON public.daily_waitlist
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Service role waitlist" ON public.daily_waitlist;
CREATE POLICY "Service role waitlist" ON public.daily_waitlist
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_waitlist_date_activity ON public.daily_waitlist(date, activity, status);

DROP TRIGGER IF EXISTS trg_waitlist_updated_at ON public.daily_waitlist;
CREATE TRIGGER trg_waitlist_updated_at BEFORE UPDATE ON public.daily_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.join_waitlist(p_date date, p_activity activity_type, p_first_name text, p_last_name text, p_email text, p_phone text, p_participants int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok', false, 'error', 'date_in_past'); END IF;
  IF p_email IS NULL OR position('@' in p_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  SELECT id INTO v_id FROM public.daily_waitlist
   WHERE date = p_date AND activity = p_activity AND lower(email) = lower(p_email)
     AND status IN ('waiting','offered') LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'id', v_id);
  END IF;

  INSERT INTO public.daily_waitlist(date, activity, first_name, last_name, email, phone, participants)
  VALUES (p_date, p_activity, p_first_name, p_last_name, lower(p_email), p_phone, GREATEST(coalesce(p_participants,1),1))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

-- Offre de place au premier de la liste (idempotent, une offre active à la fois)
CREATE OR REPLACE FUNCTION public.offer_waitlist_spot(p_date date, p_activity activity_type)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_free int;
  v_cand public.daily_waitlist;
  v_msg_id uuid := gen_random_uuid();
  v_html text;
  v_label text;
BEGIN
  -- expiration des offres dépassées
  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  IF EXISTS (SELECT 1 FROM public.daily_waitlist
              WHERE date = p_date AND activity = p_activity AND status = 'offered') THEN
    RETURN jsonb_build_object('ok', true, 'offer_pending', true);
  END IF;

  SELECT COALESCE(SUM(dg.max_participants - (
      COALESCE((SELECT SUM(participants) FROM public.reservations
                 WHERE daily_group_id = dg.id AND status <> 'cancelled'),0)
    + COALESCE((SELECT COUNT(*) FROM public.package_bookings
                 WHERE daily_group_id = dg.id AND status = 'confirmed'),0))), 0)
    INTO v_free
    FROM public.daily_groups dg
   WHERE dg.date = p_date AND dg.activity = p_activity AND dg.status = 'open';

  IF v_free < 1 THEN RETURN jsonb_build_object('ok', true, 'no_spot', true); END IF;

  SELECT * INTO v_cand FROM public.daily_waitlist
   WHERE date = p_date AND activity = p_activity AND status = 'waiting'
   ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', true, 'empty', true); END IF;

  UPDATE public.daily_waitlist
     SET status = 'offered', offered_at = now(), offer_expires_at = now() + interval '24 hours', updated_at = now()
   WHERE id = v_cand.id;

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
    '<a href="https://www.kitesurfpassion.fr/liste-attente/', v_cand.offer_token::text,
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
            || '). Confirmez sous 24 h : https://www.kitesurfpassion.fr/liste-attente/' || v_cand.offer_token::text
  ));

  INSERT INTO public.email_send_log (message_id, template_name, recipient_email, status)
  VALUES (v_msg_id::text, 'waitlist_offer', v_cand.email, 'pending');

  RETURN jsonb_build_object('ok', true, 'offered_to', v_cand.email);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_waitlist_offer(p_token uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', w.id, 'date', w.date, 'activity', w.activity, 'status', w.status,
    'first_name', w.first_name, 'participants', w.participants,
    'offer_expires_at', w.offer_expires_at)
  FROM public.daily_waitlist w WHERE w.offer_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_w public.daily_waitlist;
  v_group_id uuid;
  v_res_id uuid;
BEGIN
  SELECT * INTO v_w FROM public.daily_waitlist WHERE offer_token = p_token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_token'); END IF;
  IF v_w.status = 'converted' THEN RETURN jsonb_build_object('ok', true, 'already', true); END IF;
  IF v_w.status <> 'offered' THEN RETURN jsonb_build_object('ok', false, 'error', 'no_active_offer'); END IF;
  IF v_w.offer_expires_at < now() THEN
    UPDATE public.daily_waitlist SET status = 'expired', updated_at = now() WHERE id = v_w.id;
    RETURN jsonb_build_object('ok', false, 'error', 'offer_expired');
  END IF;

  v_group_id := public.find_or_create_daily_group(v_w.date, v_w.activity, GREATEST(v_w.participants,1));

  INSERT INTO public.reservations(
    daily_group_id, first_name, last_name, email, phone,
    skill_level, participants, status, notes
  ) VALUES (
    v_group_id, v_w.first_name, v_w.last_name, v_w.email, v_w.phone,
    'debutant', GREATEST(v_w.participants,1), 'confirmed', 'Issu de la liste d''attente'
  ) RETURNING id INTO v_res_id;

  UPDATE public.daily_waitlist SET status = 'converted', updated_at = now() WHERE id = v_w.id;

  RETURN jsonb_build_object('ok', true, 'reservation_id', v_res_id, 'daily_group_id', v_group_id);
END;
$$;

-- Balayage périodique : expire les offres et propose au suivant
CREATE OR REPLACE FUNCTION public.run_waitlist_cycle()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE r record; v_n int := 0;
BEGIN
  UPDATE public.daily_waitlist SET status = 'expired', updated_at = now()
   WHERE status = 'offered' AND offer_expires_at < now();

  FOR r IN SELECT DISTINCT date, activity FROM public.daily_waitlist
            WHERE status = 'waiting' AND date >= CURRENT_DATE
  LOOP
    PERFORM public.offer_waitlist_spot(r.date, r.activity);
    v_n := v_n + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'checked', v_n);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.offer_waitlist_spot(date, activity_type) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_waitlist_cycle() FROM anon, authenticated;