-- ============================================================
-- LOT C-2.2-C — SOCLE OTP (aucun branchement métier)
-- ============================================================

CREATE TABLE public.otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  consumed_at timestamptz NULL,
  invalidated_at timestamptz NULL,
  ip_hash text NULL
);

GRANT ALL ON public.otp_challenges TO service_role;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
-- Deny by default : aucune policy pour anon/authenticated.

CREATE INDEX idx_otp_challenges_active
  ON public.otp_challenges (package_id, expires_at)
  WHERE consumed_at IS NULL AND invalidated_at IS NULL;
CREATE INDEX idx_otp_challenges_expires ON public.otp_challenges (expires_at);

CREATE TABLE public.otp_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  challenge_id uuid NULL REFERENCES public.otp_challenges(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  absolute_expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL
);

GRANT ALL ON public.otp_sessions TO service_role;
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;
-- Deny by default : aucune policy pour anon/authenticated.

CREATE INDEX idx_otp_sessions_package ON public.otp_sessions (package_id);
CREATE UNIQUE INDEX ux_otp_sessions_challenge_once
  ON public.otp_sessions (challenge_id) WHERE challenge_id IS NOT NULL;

-- ------------------------------------------------------------
-- Génération OTP 6 chiffres, CSPRNG, rejection sampling (pas de biais modulo)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.otp_generate_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_raw bigint;
  v_limit bigint := 4294000000; -- plus grand multiple de 1e6 <= 2^32
BEGIN
  LOOP
    v_raw := ('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint;
    EXIT WHEN v_raw < v_limit;
  END LOOP;
  RETURN lpad((v_raw % 1000000)::text, 6, '0');
END;
$$;

-- ------------------------------------------------------------
-- Création d'un challenge : invalide atomiquement les précédents
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.otp_create_challenge(p_package_id uuid, p_ip_hash text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp text;
  v_id uuid;
BEGIN
  IF p_package_id IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('otp_challenge:' || p_package_id::text));

  IF NOT EXISTS (SELECT 1 FROM public.client_packages WHERE id = p_package_id) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  UPDATE public.otp_challenges
     SET invalidated_at = now()
   WHERE package_id = p_package_id
     AND consumed_at IS NULL
     AND invalidated_at IS NULL;

  v_otp := public.otp_generate_code();

  INSERT INTO public.otp_challenges (package_id, code_hash, expires_at, ip_hash)
  VALUES (p_package_id, public.code_access_hash('otp:' || v_otp), now() + interval '10 minutes', p_ip_hash)
  RETURNING id INTO v_id;

  -- l'OTP en clair n'est retourné qu'à l'appelant serveur (envoi e-mail en C-2.2-D)
  RETURN jsonb_build_object('ok', true, 'challenge_id', v_id, 'otp', v_otp,
                            'expires_at', now() + interval '10 minutes');
END;
$$;

-- ------------------------------------------------------------
-- Création de session (interne, appelée après validation)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.otp_create_session(p_package_id uuid, p_challenge_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.otp_sessions (package_id, token_hash, challenge_id, absolute_expires_at)
  VALUES (p_package_id, public.code_access_hash('otp_session:' || v_token), p_challenge_id,
          now() + interval '4 hours');

  RETURN jsonb_build_object('ok', true, 'session_token', v_token,
                            'absolute_expires_at', now() + interval '4 hours');
END;
$$;

-- ------------------------------------------------------------
-- Validation / consommation atomique + anti-replay
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.otp_verify_challenge(p_challenge_id uuid, p_otp text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_pkg uuid;
  v_consumed uuid;
BEGIN
  IF p_challenge_id IS NULL OR p_otp IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  -- incrément atomique du compteur : n'accepte que les tentatives 1..5
  UPDATE public.otp_challenges
     SET attempt_count = attempt_count + 1
   WHERE id = p_challenge_id
     AND consumed_at IS NULL
     AND invalidated_at IS NULL
     AND expires_at > now()
     AND attempt_count < 5
  RETURNING code_hash, package_id INTO v_hash, v_pkg;

  IF v_hash IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF v_hash <> public.code_access_hash('otp:' || btrim(p_otp)) THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  -- consommation atomique : un seul gagnant possible
  UPDATE public.otp_challenges
     SET consumed_at = now()
   WHERE id = p_challenge_id
     AND consumed_at IS NULL
     AND invalidated_at IS NULL
     AND expires_at > now()
  RETURNING id INTO v_consumed;

  IF v_consumed IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  RETURN public.otp_create_session(v_pkg, p_challenge_id);
END;
$$;

-- ------------------------------------------------------------
-- Privilèges : socle interne uniquement (aucun accès anon/authenticated)
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.otp_generate_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.otp_create_challenge(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.otp_create_session(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.otp_verify_challenge(uuid, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.otp_create_challenge(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.otp_create_session(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.otp_verify_challenge(uuid, text) TO service_role;