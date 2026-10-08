-- F-28-07-03 — Statistiques / revenus / assistant : activité client vs groupe vs pack.
-- Rollback automatique ; dates 2099. Attendu : ERROR "F28_07_03_ALL_PASS".
DO $$
DECLARE
  d date := '2099-05-04';
  v_admin uuid; g_k uuid; g_s uuid; g_w uuid; g_p uuid; g_f uuid; v_pkg uuid; r_ks uuid;
  q jsonb; f jsonb; v_n int; v_t text;
  p jsonb := jsonb_build_object('start','2099-05-04','end','2099-05-04');
BEGIN
  SELECT user_id INTO v_admin FROM user_roles WHERE role='admin' LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',v_admin,'role','authenticated')::text, true);
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES (d,'kitesurf',1,4,'open') RETURNING id INTO g_k;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES (d,'stage_100_glisse',1,4,'open') RETURNING id INTO g_s;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES (d,'wingfoil',1,3,'open') RETURNING id INTO g_w;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES (d,'pumpfoil',1,4,'open') RETURNING id INTO g_p;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES (d,'foil_tracte',1,4,'open') RETURNING id INTO g_f;
  INSERT INTO client_packages(package_code,email,first_name,last_name,activity,package_type,total_sessions,status,expires_at)
    VALUES ('TEST-F280703','pk-f280703@test.invalid','P','X','stage_100_glisse','stage',5,'active',now()+interval '1 year') RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id,status,booking_kind,daily_group_id) VALUES (v_pkg,'confirmed','regular',g_s);
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_k,'T1','X','t1-f280703@test.invalid','0600000000','debutant',1,'confirmed','kitesurf','cs_f280703_1');
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_s,'T2','X','t2-f280703@test.invalid','0600000000','debutant',1,'confirmed','kitesurf','cs_f280703_2') RETURNING id INTO r_ks;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_s,'T3','X','t3-f280703@test.invalid','0600000000','debutant',1,'confirmed','stage_100_glisse','cs_f280703_3');
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_w,'T4','X','t4-f280703@test.invalid','0600000000','debutant',1,'confirmed','wingfoil','cs_f280703_4');
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_p,'T5','X','t5-f280703@test.invalid','0600000000','debutant',1,'confirmed','pumpfoil','cs_f280703_5');
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity,stripe_session_id) VALUES
    (g_f,'T6','X','t6-f280703@test.invalid','0600000000','debutant',1,'confirmed','foil_tracte','cs_f280703_6');

  -- T1-T6 : assistant_query('reservations') par activité client
  q := assistant_query('reservations', p);
  IF (q->'par_activite'->>'kitesurf')::int <> 2 OR (q->'par_activite'->>'stage_100_glisse')::int <> 1
     OR (q->'par_activite'->>'wingfoil')::int <> 1 OR (q->'par_activite'->>'pumpfoil')::int <> 1
     OR (q->'par_activite'->>'foil_tracte')::int <> 1 THEN
    RAISE EXCEPTION 'F28_07_03_FAIL T1-T6 reservations: %', q->'par_activite'; END IF;
  -- T10 : filtre activité = kitesurf retrouve T2, filtre Stage ne le compte pas
  q := assistant_query('reservations', p || '{"activity":"kitesurf"}');
  IF (q->>'total_reservations')::int <> 2 THEN RAISE EXCEPTION 'F28_07_03_FAIL T10 kite: %', q; END IF;
  q := assistant_query('reservations', p || '{"activity":"stage_100_glisse"}');
  IF (q->>'total_reservations')::int <> 1 THEN RAISE EXCEPTION 'F28_07_03_FAIL T10 stage: %', q; END IF;
  -- meilleure_activite : CA kitesurf = 2 réservations
  q := assistant_query('meilleure_activite', p);
  SELECT (a->>'reservations')::int INTO v_n FROM jsonb_array_elements(q->'activites') a WHERE a->>'activite'='kitesurf';
  IF v_n <> 2 THEN RAISE EXCEPTION 'F28_07_03_FAIL meilleure_activite: %', q; END IF;
  -- T8 : statistiques groupe restent sur l'activité du groupe
  q := assistant_query('reservations_detail', p || '{"activity":"stage_100_glisse"}');
  IF jsonb_array_length(q->'journees') <> 1 OR (q->'journees'->0->>'inscrits')::int <> 3 THEN
    RAISE EXCEPTION 'F28_07_03_FAIL T8 groupe Stage: %', q; END IF;
  q := assistant_query('remplissage', p || '{"activity":"stage_100_glisse"}');
  IF (q->>'groupes')::int <> 1 THEN RAISE EXCEPTION 'F28_07_03_FAIL T8 remplissage: %', q; END IF;

  -- T9 : assistant_financial_summary classe T2 en kitesurf (prestation au tarif kitesurf)
  f := assistant_financial_summary();
  SELECT x->>'activite' INTO v_t FROM jsonb_array_elements(f->'details'->'prestations') x WHERE x->>'email'='t2-f280703@test.invalid';
  IF v_t IS DISTINCT FROM 'kitesurf' THEN RAISE EXCEPTION 'F28_07_03_FAIL T9 prestation: %', v_t; END IF;
  IF (SELECT (x->>'montant_eur')::numeric FROM jsonb_array_elements(f->'details'->'prestations') x WHERE x->>'email'='t2-f280703@test.invalid')
     <> unit_price_eur('kitesurf','collectif',d) THEN RAISE EXCEPTION 'F28_07_03_FAIL T9 tarif'; END IF;
  SELECT x->>'activite' INTO v_t FROM jsonb_array_elements(f->'details'->'acomptes') x WHERE x->>'email'='t2-f280703@test.invalid';
  IF v_t IS DISTINCT FROM 'kitesurf' THEN RAISE EXCEPTION 'F28_07_03_FAIL T9 acompte: %', v_t; END IF;
  -- T7 : le pack reste classé Stage
  SELECT x->>'activite' INTO v_t FROM jsonb_array_elements(f->'details'->'prestations') x WHERE x->>'email'='pk-f280703@test.invalid';
  IF v_t IS DISTINCT FROM 'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_03_FAIL T7 pack: %', v_t; END IF;

  -- Payload frontend (mêmes colonnes que statsService) : client_activity et groupe distincts
  SELECT count(*) INTO v_n FROM reservations r JOIN daily_groups g ON g.id=r.daily_group_id
   WHERE r.id=r_ks AND r.client_activity='kitesurf' AND g.activity='stage_100_glisse';
  IF v_n <> 1 THEN RAISE EXCEPTION 'F28_07_03_FAIL payload'; END IF;

  RAISE EXCEPTION 'F28_07_03_ALL_PASS';
END $$;
