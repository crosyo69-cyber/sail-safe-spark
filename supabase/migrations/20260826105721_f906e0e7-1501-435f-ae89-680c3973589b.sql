-- =====================================================================
-- LOT D-4-FIX-2 — R5 PHASE C : émission des tokens en mémoire
-- Préparatoire / réversible. Aucune suppression de colonne / trigger.
-- =====================================================================

-- 1) Table multi-hash (aucun token clair)
CREATE TABLE IF NOT EXISTS public.public_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose text NOT NULL,
  subject_id text NOT NULL,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  expires_at timestamptz
);

GRANT ALL ON public.public_link_tokens TO service_role;
REVOKE ALL ON public.public_link_tokens FROM anon, authenticated;

ALTER TABLE public.public_link_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages public link tokens" ON public.public_link_tokens;
CREATE POLICY "service role manages public link tokens"
  ON public.public_link_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS public_link_tokens_purpose_hash_uidx
  ON public.public_link_tokens (purpose, token_hash);
CREATE INDEX IF NOT EXISTS public_link_tokens_subject_idx
  ON public.public_link_tokens (subject_id, purpose);

-- 2) Émission : token uniquement en mémoire, DB = hash
CREATE OR REPLACE FUNCTION public.issue_link_token(
  p_purpose text,
  p_subject_id text,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_token uuid;
BEGIN
  IF p_purpose IS NULL OR btrim(p_purpose) = '' THEN
    RAISE EXCEPTION 'purpose_required';
  END IF;
  IF p_subject_id IS NULL OR btrim(p_subject_id) = '' THEN
    RAISE EXCEPTION 'subject_required';
  END IF;

  v_token := gen_random_uuid();

  INSERT INTO public.public_link_tokens (purpose, subject_id, token_hash, expires_at)
  VALUES (btrim(p_purpose), btrim(p_subject_id),
          public.code_access_hash(v_token::text), p_expires_at);

  RETURN v_token::text;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_link_token(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_link_token(text, text, timestamptz) TO service_role;

-- 3) Résolution : lookup exclusivement par hash
CREATE OR REPLACE FUNCTION public.resolve_link_token(p_purpose text, p_token uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.subject_id
    FROM public.public_link_tokens t
   WHERE p_token IS NOT NULL
     AND t.purpose = p_purpose
     AND t.token_hash = public.code_access_hash(p_token::text)
     AND t.revoked_at IS NULL
     AND (t.expires_at IS NULL OR t.expires_at > now())
   ORDER BY t.created_at DESC
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_link_token(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_link_token(text, uuid) TO service_role;

-- 4) T4 — émission dédiée préférences marketing (pas de TTL)
CREATE OR REPLACE FUNCTION public.marketing_issue_pref_token(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_email text := lower(btrim(coalesce(p_email, '')));
BEGIN
  IF v_email = '' THEN RAISE EXCEPTION 'email_required'; END IF;
  RETURN public.issue_link_token('marketing_prefs', v_email, NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.marketing_issue_pref_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketing_issue_pref_token(text) TO service_role;

-- 5) T1 — WAITLIST : émission en mémoire + compatibilité anciens liens
CREATE OR REPLACE FUNCTION public.offer_waitlist_spot(p_date date, p_activity activity_type)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Token généré en mémoire, DB = hash uniquement (TTL métier 24 h)
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
$$;

-- 6) T1 — consommation : hash legacy OU hash public_link_tokens
CREATE OR REPLACE FUNCTION public.get_waitlist_offer(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ip text;
  v_out jsonb;
  v_subject text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('waitlist_offer_get', 'ip:' || v_ip, 30, interval '10 minutes') THEN
    RETURN NULL;
  END IF;

  v_subject := public.resolve_link_token('waitlist_offer', p_token);

  SELECT jsonb_build_object(
    'id', w.id, 'date', w.date, 'activity', w.activity, 'status', w.status,
    'first_name', w.first_name, 'participants', w.participants,
    'offer_expires_at', w.offer_expires_at)
    INTO v_out
    FROM public.daily_waitlist w
   WHERE (v_subject IS NOT NULL AND w.id = v_subject::uuid)
      OR (v_subject IS NULL AND w.offer_token_hash = public.code_access_hash(p_token::text));

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_w public.daily_waitlist;
  v_group_id uuid;
  v_res_id uuid;
  v_ip text;
  v_subject text;
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

-- 7) T2 / T3 — LAST MINUTE : consommation multi-hash
CREATE OR REPLACE FUNCTION public.confirm_last_minute_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_n int; v_ip text; v_subject text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_confirm', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  v_subject := public.resolve_link_token('last_minute_confirm', p_token);

  UPDATE public.last_minute_subscribers
     SET confirmed = true, confirmed_at = now(), updated_at = now()
   WHERE confirmed = false
     AND ((v_subject IS NOT NULL AND id = v_subject::uuid)
       OR (v_subject IS NULL AND confirm_token_hash = public.code_access_hash(p_token::text)));
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_last_minute(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_n int; v_ip text; v_subject text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_unsubscribe', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  v_subject := public.resolve_link_token('last_minute_unsubscribe', p_token);

  DELETE FROM public.last_minute_subscribers
   WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
      OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text));
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

-- 8) T4 — MARKETING : résolution multi-hash
CREATE OR REPLACE FUNCTION public.resolve_marketing_email(p_token uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    public.resolve_link_token('marketing_prefs', p_token),
    (SELECT lower(mp.email)
       FROM public.marketing_preferences mp
      WHERE p_token IS NOT NULL
        AND mp.token_hash = public.code_access_hash(p_token::text)
      LIMIT 1)
  );
$$;

-- 9) T5 — WEATHER : consommation multi-hash (pas de TTL)
CREATE OR REPLACE FUNCTION public.unsubscribe_weather_alert(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_found boolean; v_subject text;
BEGIN
  v_subject := public.resolve_link_token('weather_unsubscribe', p_token);

  UPDATE public.weather_alert_subscriptions
     SET enabled = false, updated_at = now()
   WHERE enabled = true
     AND ((v_subject IS NOT NULL AND id = v_subject::uuid)
       OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text)));

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_weather_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_found boolean; v_subject text;
BEGIN
  v_subject := public.resolve_link_token('weather_unsubscribe', p_token);

  DELETE FROM public.weather_alert_subscriptions
   WHERE (v_subject IS NOT NULL AND id = v_subject::uuid)
      OR (v_subject IS NULL AND unsubscribe_token_hash = public.code_access_hash(p_token::text));

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;
