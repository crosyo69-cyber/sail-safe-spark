-- ============================================================
-- LOT D-2-FIX — R3 (rate-limit), R4 (oracle), R4b (doublons)
-- Périmètre strict : parcours publics D-2.
-- Aucun objet C-1 / C-2 / C-3 / D-1 modifié.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Socle de rate-limit DÉDIÉ aux parcours publics.
--    Compteurs strictement séparés de code_access_attempts (C-2).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_rate_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context text NOT NULL,
  key_hash text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Aucun accès Data API pour anon/authenticated : table purement technique.
GRANT ALL ON public.public_rate_attempts TO service_role;

ALTER TABLE public.public_rate_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages public rate attempts"
  ON public.public_rate_attempts FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_public_rate_attempts_lookup
  ON public.public_rate_attempts (context, key_hash, created_at DESC);

-- ------------------------------------------------------------
-- 2. Garde de débit atomique (advisory lock => pas de course
--    SELECT count -> INSERT). Ne touche JAMAIS code_access_*.
--    Seuils = paramètres de sécurité, passés par l'appelant.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_rate_guard(
  p_context text,
  p_key text,
  p_limit integer,
  p_window interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_hash text;
  v_count integer;
BEGIN
  -- Appel interne (cron / service_role / SQL direct) : pas de clé => pas de garde.
  IF p_key IS NULL OR btrim(p_key) = '' THEN
    RETURN true;
  END IF;

  -- Hash pepperisé : ni IP ni e-mail en clair (réutilisation en LECTURE
  -- seule du helper de hash ; aucun compteur C-2 n'est lu ni écrit).
  v_hash := public.code_access_hash(p_context || '|' || p_key);

  PERFORM pg_advisory_xact_lock(hashtext('public_rate:' || p_context || ':' || v_hash));

  SELECT count(*) INTO v_count
    FROM public.public_rate_attempts
   WHERE context = p_context
     AND key_hash = v_hash
     AND created_at > now() - p_window;

  IF v_count >= p_limit THEN
    INSERT INTO public.public_rate_attempts(context, key_hash, blocked)
    VALUES (p_context, v_hash, true);
    RETURN false;
  END IF;

  INSERT INTO public.public_rate_attempts(context, key_hash, blocked)
  VALUES (p_context, v_hash, false);
  RETURN true;
END;
$function$;

-- Helper interne : appelé uniquement depuis les RPC SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.public_rate_guard(text, text, integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_rate_guard(text, text, integer, interval) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_rate_guard(text, text, integer, interval) TO service_role;

-- ------------------------------------------------------------
-- 3. R4b — la base devient la source de vérité anti-doublon.
--    Vérifié avant migration : 0 doublon historique.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_daily_waitlist_active_entry
  ON public.daily_waitlist (date, activity, lower(email))
  WHERE status IN ('waiting', 'offered');

-- ------------------------------------------------------------
-- 4. R3 + R4 — join_waitlist : rate-limit AVANT toute réponse
--    discriminante, insertion atomique, réponse uniforme.
--    Seuils : 5 appels / 10 min / IP ; 3 inscriptions / 15 min / e-mail.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_date date,
  p_activity activity_type,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_participants integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ip text;
  v_email text;
BEGIN
  -- 1. validation syntaxique minimale (aucune info sur l'existence d'une personne)
  IF p_date < CURRENT_DATE THEN RETURN jsonb_build_object('ok', false, 'error', 'date_in_past'); END IF;
  IF p_email IS NULL OR position('@' in p_email) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  v_email := lower(btrim(p_email));
  v_ip := public.code_access_client_ip();

  -- 2. rate-limit AVANT toute réponse permettant de distinguer un doublon
  IF v_ip IS NOT NULL THEN
    IF NOT public.public_rate_guard('waitlist_join', 'ip:' || v_ip, 5, interval '10 minutes') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;
    IF NOT public.public_rate_guard('waitlist_join_email', 'email:' || v_email, 3, interval '15 minutes') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
    END IF;
  END IF;

  -- 3. insertion atomique — la contrainte unique partielle gère le doublon
  INSERT INTO public.daily_waitlist(date, activity, first_name, last_name, email, phone, participants)
  VALUES (p_date, p_activity, p_first_name, p_last_name, v_email, p_phone,
          GREATEST(coalesce(p_participants, 1), 1))
  ON CONFLICT DO NOTHING;

  -- 4/5. réponse publique uniforme : aucun `already`, aucun UUID exposé
  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- ------------------------------------------------------------
-- 5. R3 — get_waitlist_offer : 30 / 10 min / IP.
--    Passe en plpgsql VOLATILE (la garde journalise).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_waitlist_offer(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ip text;
  v_out jsonb;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('waitlist_offer_get', 'ip:' || v_ip, 30, interval '10 minutes') THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', w.id, 'date', w.date, 'activity', w.activity, 'status', w.status,
    'first_name', w.first_name, 'participants', w.participants,
    'offer_expires_at', w.offer_expires_at)
    INTO v_out
    FROM public.daily_waitlist w WHERE w.offer_token = p_token;

  RETURN v_out;
END;
$function$;

-- ------------------------------------------------------------
-- 6. R3 — confirm_waitlist_offer : 10 / 10 min / IP.
--    Logique métier et FOR UPDATE inchangés.
-- ------------------------------------------------------------
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
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('waitlist_offer_confirm', 'ip:' || v_ip, 10, interval '10 minutes') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'rate_limited');
  END IF;

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
$function$;

-- ------------------------------------------------------------
-- 7. R3 — parcours last-minute : 20 / 10 min / IP.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_last_minute_subscription(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_n int; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_confirm', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  UPDATE public.last_minute_subscribers
     SET confirmed = true, confirmed_at = now(), updated_at = now()
   WHERE confirm_token = p_token AND confirmed = false;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unsubscribe_last_minute(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_n int; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_unsubscribe', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  DELETE FROM public.last_minute_subscribers WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$function$;

-- ------------------------------------------------------------
-- 8. R3 — préférences marketing par token : 20 / 10 min / IP.
--    Les variantes *_by_session (C-2) ne sont PAS touchées.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_marketing_preferences(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('marketing_get', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  v_email := public.resolve_marketing_email(p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN public.marketing_preferences_payload(v_email);
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_marketing_preferences(
  p_consent boolean,
  p_activities text[],
  p_topics text[],
  p_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_email text; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('marketing_save', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN jsonb_build_object('success', false, 'error', 'rate_limited');
  END IF;

  v_email := public.resolve_marketing_email(p_token);
  IF v_email IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  RETURN public.marketing_preferences_save(v_email, p_consent, p_activities, p_topics);
END;
$function$;