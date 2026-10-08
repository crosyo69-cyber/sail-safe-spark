-- F-28-07-02 — Payload de AdminReservationList : reservations.* + daily_groups(date, activity).
-- Vérifie que client_activity (libellé principal) et l'activité du groupe (secondaire) restent distincts.
-- Rollback automatique ; dates 2099. Attendu : ERROR "F28_07_02_ALL_PASS".
DO $$
DECLARE
  d date := '2099-04-06';
  g_k uuid; g_s uuid; g_w uuid; g_p uuid; g_f uuid; v_pkg uuid;
  r1 uuid; r2 uuid; r3 uuid; r4 uuid; r5 uuid; r6 uuid;
  v_ca text; v_ga text; v_n int;
BEGIN
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d,'kitesurf',1,4,'open') RETURNING id INTO g_k;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d,'stage_100_glisse',1,4,'open') RETURNING id INTO g_s;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d,'wingfoil',1,3,'open') RETURNING id INTO g_w;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d,'pumpfoil',1,4,'open') RETURNING id INTO g_p;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d,'foil_tracte',1,4,'open') RETURNING id INTO g_f;
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F280702','p-f280702@test.invalid','P','F280702','stage_100_glisse','stage',5,'active',now()+interval '1 year') RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',g_s);

  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_k,'T1','X','t1-f280702@test.invalid','0600000000','debutant',1,'confirmed','kitesurf') RETURNING id INTO r1;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_s,'T2','X','t2-f280702@test.invalid','0600000000','debutant',1,'confirmed','kitesurf') RETURNING id INTO r2;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_s,'T3','X','t3-f280702@test.invalid','0600000000','debutant',1,'confirmed','stage_100_glisse') RETURNING id INTO r3;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_w,'T4','X','t4-f280702@test.invalid','0600000000','debutant',1,'confirmed','wingfoil') RETURNING id INTO r4;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_p,'T5','X','t5-f280702@test.invalid','0600000000','debutant',1,'confirmed','pumpfoil') RETURNING id INTO r5;
  INSERT INTO reservations(daily_group_id,first_name,last_name,email,phone,skill_level,participants,status,client_activity) VALUES
    (g_f,'T6','X','t6-f280702@test.invalid','0600000000','debutant',1,'confirmed','foil_tracte') RETURNING id INTO r6;

  -- Même jointure que la requête de AdminReservationList
  SELECT r.client_activity::text, g.activity::text INTO v_ca, v_ga FROM reservations r LEFT JOIN daily_groups g ON g.id=r.daily_group_id WHERE r.id=r1;
  IF v_ca<>'kitesurf' OR v_ga<>'kitesurf' THEN RAISE EXCEPTION 'F28_07_02_FAIL T1 % %',v_ca,v_ga; END IF;
  SELECT r.client_activity::text, g.activity::text INTO v_ca, v_ga FROM reservations r LEFT JOIN daily_groups g ON g.id=r.daily_group_id WHERE r.id=r2;
  IF v_ca<>'kitesurf' OR v_ga<>'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_02_FAIL T2 % %',v_ca,v_ga; END IF;
  SELECT r.client_activity::text, g.activity::text INTO v_ca, v_ga FROM reservations r LEFT JOIN daily_groups g ON g.id=r.daily_group_id WHERE r.id=r3;
  IF v_ca<>'stage_100_glisse' OR v_ga<>'stage_100_glisse' THEN RAISE EXCEPTION 'F28_07_02_FAIL T3'; END IF;
  SELECT client_activity::text INTO v_ca FROM reservations WHERE id=r4; IF v_ca<>'wingfoil' THEN RAISE EXCEPTION 'F28_07_02_FAIL T4'; END IF;
  SELECT client_activity::text INTO v_ca FROM reservations WHERE id=r5; IF v_ca<>'pumpfoil' THEN RAISE EXCEPTION 'F28_07_02_FAIL T5'; END IF;
  SELECT client_activity::text INTO v_ca FROM reservations WHERE id=r6; IF v_ca<>'foil_tracte' THEN RAISE EXCEPTION 'F28_07_02_FAIL T6'; END IF;
  -- T7 : sélection « activité client = kitesurf » inclut T2, sélection Stage ne l'inclut pas
  SELECT count(*) INTO v_n FROM reservations WHERE email LIKE '%-f280702@test.invalid' AND client_activity='kitesurf';
  IF v_n<>2 THEN RAISE EXCEPTION 'F28_07_02_FAIL T7 kite=%',v_n; END IF;
  SELECT count(*) INTO v_n FROM reservations WHERE id=r2 AND client_activity='stage_100_glisse';
  IF v_n<>0 THEN RAISE EXCEPTION 'F28_07_02_FAIL T7 stage'; END IF;

  RAISE EXCEPTION 'F28_07_02_ALL_PASS';
END $$;
