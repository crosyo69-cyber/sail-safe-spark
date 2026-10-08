-- F-28-07-01 — Test de non-régression CRM : activité client = reservations.client_activity
-- Tout est annulé par l'exception finale (rollback automatique) ; dates en 2099.
-- Résultat attendu : ERROR "F28_07_01_ALL_PASS" ; tout échec lève "F28_07_01_FAIL ...".
-- Admin simulé via request.jwt.claims (local à la transaction annulée).
DO $$
DECLARE
  d date := '2099-03-02';
  v_admin uuid; g_kite uuid; g_stage uuid; g_wing uuid; v_pkg uuid;
  r_kk uuid; r_ks uuid; r_ss uuid; r_ww uuid;
  v_detail jsonb; v_acts text[]; v_act text; v_n int;
  e_mix text := 'mix-f280701@test.invalid';
  e_ks  text := 'ks-f280701@test.invalid';
BEGIN
  SELECT user_id INTO v_admin FROM user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'F28_07_01_FAIL setup: aucun admin'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d, 'kitesurf', 1, 4, 'open') RETURNING id INTO g_kite;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO g_stage;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d, 'wingfoil', 1, 3, 'open') RETURNING id INTO g_wing;

  -- Stage occupé : un pack Stage confirmé dans le groupe Stage (appartenant au client "mix")
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F280701', e_mix, 'Mix', 'F280701', 'stage_100_glisse', 'stage', 5, 'active', now() + interval '1 year') RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg, 'confirmed', 'regular', g_stage);

  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (g_kite, 'Mix', 'F280701', e_mix, '0600000000', 'debutant', 1, 'confirmed', 'kitesurf') RETURNING id INTO r_kk;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (g_stage, 'Mix', 'F280701', e_mix, '0600000000', 'debutant', 1, 'confirmed', 'kitesurf') RETURNING id INTO r_ks;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (g_stage, 'Mix', 'F280701', e_mix, '0600000000', 'debutant', 1, 'confirmed', 'stage_100_glisse') RETURNING id INTO r_ss;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity, stripe_session_id)
    VALUES (g_wing, 'Mix', 'F280701', e_mix, '0600000000', 'debutant', 1, 'confirmed', 'wingfoil', 'cs_test_f280701') RETURNING id INTO r_ww;
  -- Client isolé : uniquement Kitesurf dans groupe Stage occupé (cas central)
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity, stripe_session_id)
    VALUES (g_stage, 'KS', 'F280701', e_ks, '0600000000', 'debutant', 1, 'confirmed', 'kitesurf', 'cs_test_f280701_ks');

  v_detail := crm_client_detail(e_mix);

  -- T1 Kitesurf / groupe Kitesurf
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'id' = r_kk::text;
  IF v_act IS DISTINCT FROM 'kitesurf' THEN RAISE EXCEPTION 'F28_07_01_FAIL T1: %', v_act; END IF;
  -- T2 Kitesurf / groupe Stage occupé
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'id' = r_ks::text;
  IF v_act IS DISTINCT FROM 'kitesurf' THEN RAISE EXCEPTION 'F28_07_01_FAIL T2: %', v_act; END IF;
  -- T3 Stage réel
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'id' = r_ss::text;
  IF v_act IS DISTINCT FROM 'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_01_FAIL T3: %', v_act; END IF;
  -- T4 Wingfoil (booking + paiement)
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'id' = r_ww::text;
  IF v_act IS DISTINCT FROM 'wingfoil' THEN RAISE EXCEPTION 'F28_07_01_FAIL T4: %', v_act; END IF;
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'payments') x WHERE x->>'stripe_session_id' = 'cs_test_f280701';
  IF v_act IS DISTINCT FROM 'wingfoil' THEN RAISE EXCEPTION 'F28_07_01_FAIL T4 paiement: %', v_act; END IF;

  -- T5 Historique + T6 Agrégation : client "KS" (Kitesurf dans Stage uniquement)
  v_detail := crm_client_detail(e_ks);
  SELECT count(*) INTO v_n FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'activity' = 'kitesurf';
  IF v_n <> 1 THEN RAISE EXCEPTION 'F28_07_01_FAIL T5 historique: %', v_detail->'bookings'; END IF;
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'payments') x WHERE x->>'source' = 'reservation';
  IF v_act IS DISTINCT FROM 'kitesurf' THEN RAISE EXCEPTION 'F28_07_01_FAIL T5 paiement: %', v_act; END IF;
  SELECT activities INTO v_acts FROM crm_client_base() WHERE email = e_ks;
  IF v_acts IS DISTINCT FROM ARRAY['kitesurf'] THEN RAISE EXCEPTION 'F28_07_01_FAIL T6 agrégation: %', v_acts; END IF;
  -- Cas central : groupe reste Stage
  SELECT count(*) INTO v_n FROM reservations r JOIN daily_groups g ON g.id = r.daily_group_id
   WHERE r.email = e_ks AND r.client_activity = 'kitesurf' AND g.activity = 'stage_100_glisse';
  IF v_n <> 1 THEN RAISE EXCEPTION 'F28_07_01_FAIL central groupe'; END IF;

  -- T7 Package Stage : pack, booking pack et activités agrégées restent Stage
  v_detail := crm_client_detail(e_mix);
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'packages') x WHERE x->>'id' = v_pkg::text;
  IF v_act IS DISTINCT FROM 'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_01_FAIL T7 pack: %', v_act; END IF;
  SELECT x->>'activity' INTO v_act FROM jsonb_array_elements(v_detail->'bookings') x WHERE x->>'kind' = 'package';
  IF v_act IS DISTINCT FROM 'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_01_FAIL T7 booking pack: %', v_act; END IF;
  SELECT activities INTO v_acts FROM crm_client_base() WHERE email = e_mix;
  IF NOT (v_acts @> ARRAY['kitesurf','stage_100_glisse','wingfoil'] AND cardinality(v_acts) = 3) THEN
    RAISE EXCEPTION 'F28_07_01_FAIL T7 agrégation mix: %', v_acts; END IF;

  RAISE EXCEPTION 'F28_07_01_ALL_PASS';
END $$;
