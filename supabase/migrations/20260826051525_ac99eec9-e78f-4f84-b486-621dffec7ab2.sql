-- ============================================================
-- LOT D-3-FIX
-- R7 : REVOKE admin_cancel_and_recredit
-- R6 : REVOKE grants excédentaires
-- R5 : colonnes hash + backfill + lookup hashé (Phase A/B)
-- ============================================================

-- ---------- R7 ----------
REVOKE EXECUTE ON FUNCTION public.admin_cancel_and_recredit(text, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_and_recredit(text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_and_recredit(text, uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_and_recredit(text, uuid, text) TO service_role;

-- ---------- R6 ----------
REVOKE INSERT, UPDATE ON public.daily_waitlist FROM anon, authenticated;
REVOKE INSERT, UPDATE ON public.last_minute_subscribers FROM anon, authenticated;
REVOKE INSERT, UPDATE ON public.email_unsubscribe_tokens FROM anon, authenticated;
GRANT ALL ON public.daily_waitlist TO service_role;
GRANT ALL ON public.last_minute_subscribers TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

-- ---------- R5 : colonnes hash ----------
ALTER TABLE public.daily_waitlist              ADD COLUMN IF NOT EXISTS offer_token_hash       text;
ALTER TABLE public.last_minute_subscribers     ADD COLUMN IF NOT EXISTS confirm_token_hash     text;
ALTER TABLE public.last_minute_subscribers     ADD COLUMN IF NOT EXISTS unsubscribe_token_hash text;
ALTER TABLE public.marketing_preferences       ADD COLUMN IF NOT EXISTS token_hash             text;
ALTER TABLE public.weather_alert_subscriptions ADD COLUMN IF NOT EXISTS unsubscribe_token_hash text;

-- Triggers de maintien (aucun SQL dynamique)
CREATE OR REPLACE FUNCTION public.sync_waitlist_token_hash()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.offer_token_hash := public.code_access_hash(NEW.offer_token::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_last_minute_token_hash()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.confirm_token_hash     := public.code_access_hash(NEW.confirm_token::text);
  NEW.unsubscribe_token_hash := public.code_access_hash(NEW.unsubscribe_token::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_marketing_token_hash()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.token_hash := public.code_access_hash(NEW.token::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_weather_token_hash()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.unsubscribe_token_hash := public.code_access_hash(NEW.unsubscribe_token::text);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_waitlist_token_hash()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_last_minute_token_hash()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_marketing_token_hash()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_weather_token_hash()      FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_waitlist_token_hash ON public.daily_waitlist;
CREATE TRIGGER trg_waitlist_token_hash
  BEFORE INSERT OR UPDATE OF offer_token ON public.daily_waitlist
  FOR EACH ROW EXECUTE FUNCTION public.sync_waitlist_token_hash();

DROP TRIGGER IF EXISTS trg_last_minute_token_hash ON public.last_minute_subscribers;
CREATE TRIGGER trg_last_minute_token_hash
  BEFORE INSERT OR UPDATE OF confirm_token, unsubscribe_token ON public.last_minute_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.sync_last_minute_token_hash();

DROP TRIGGER IF EXISTS trg_marketing_token_hash ON public.marketing_preferences;
CREATE TRIGGER trg_marketing_token_hash
  BEFORE INSERT OR UPDATE OF token ON public.marketing_preferences
  FOR EACH ROW EXECUTE FUNCTION public.sync_marketing_token_hash();

DROP TRIGGER IF EXISTS trg_weather_token_hash ON public.weather_alert_subscriptions;
CREATE TRIGGER trg_weather_token_hash
  BEFORE INSERT OR UPDATE OF unsubscribe_token ON public.weather_alert_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_weather_token_hash();

-- Backfill (compatibilité stricte des liens déjà envoyés)
UPDATE public.daily_waitlist
   SET offer_token_hash = public.code_access_hash(offer_token::text)
 WHERE offer_token_hash IS NULL AND offer_token IS NOT NULL;

UPDATE public.last_minute_subscribers
   SET confirm_token_hash     = public.code_access_hash(confirm_token::text),
       unsubscribe_token_hash = public.code_access_hash(unsubscribe_token::text)
 WHERE confirm_token_hash IS NULL OR unsubscribe_token_hash IS NULL;

UPDATE public.marketing_preferences
   SET token_hash = public.code_access_hash(token::text)
 WHERE token_hash IS NULL AND token IS NOT NULL;

UPDATE public.weather_alert_subscriptions
   SET unsubscribe_token_hash = public.code_access_hash(unsubscribe_token::text)
 WHERE unsubscribe_token_hash IS NULL AND unsubscribe_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_daily_waitlist_offer_token_hash       ON public.daily_waitlist(offer_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS ux_lms_confirm_token_hash                ON public.last_minute_subscribers(confirm_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS ux_lms_unsubscribe_token_hash            ON public.last_minute_subscribers(unsubscribe_token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS ux_marketing_preferences_token_hash      ON public.marketing_preferences(token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS ux_was_unsubscribe_token_hash            ON public.weather_alert_subscriptions(unsubscribe_token_hash);

-- ---------- R5 : lookups par hash (corps inchangés par ailleurs) ----------
CREATE OR REPLACE FUNCTION public.get_waitlist_offer(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    FROM public.daily_waitlist w
   WHERE w.offer_token_hash = public.code_access_hash(p_token::text);

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_waitlist_offer(p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  SELECT * INTO v_w FROM public.daily_waitlist
   WHERE offer_token_hash = public.code_access_hash(p_token::text) FOR UPDATE;
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

CREATE OR REPLACE FUNCTION public.confirm_last_minute_subscription(p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_confirm', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  UPDATE public.last_minute_subscribers
     SET confirmed = true, confirmed_at = now(), updated_at = now()
   WHERE confirm_token_hash = public.code_access_hash(p_token::text) AND confirmed = false;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.unsubscribe_last_minute(p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int; v_ip text;
BEGIN
  v_ip := public.code_access_client_ip();
  IF v_ip IS NOT NULL
     AND NOT public.public_rate_guard('last_minute_unsubscribe', 'ip:' || v_ip, 20, interval '10 minutes') THEN
    RETURN false;
  END IF;

  DELETE FROM public.last_minute_subscribers
   WHERE unsubscribe_token_hash = public.code_access_hash(p_token::text);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_marketing_email(p_token uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lower(mp.email)
    FROM public.marketing_preferences mp
   WHERE p_token IS NOT NULL
     AND mp.token_hash = public.code_access_hash(p_token::text)
   LIMIT 1;
$$;