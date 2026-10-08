-- F-28-06 — Test de non-régression : admin_move_group_member / admin_reschedule_booking
-- Tout est annulé par l'exception finale (rollback automatique) ; dates en 2099.
-- Résultat attendu : ERROR "F28_06_ALL_PASS" ; tout échec lève "F28_06_FAIL ...".
-- L'appelant admin est simulé via request.jwt.claims (local à la transaction annulée),
-- la garde has_role(auth.uid(),'admin') des fonctions reste active.
DO $$
DECLARE
  d0 date := '2099-02-02'; d1 date := '2099-02-03'; d2 date := '2099-02-04';
  d3 date := '2099-02-05'; d4 date := '2099-02-06'; d5 date := '2099-02-09';
  v_admin uuid; v_src uuid; v_res uuid; v_wres uuid; v_stage uuid; v_kite uuid;
  v_pkg uuid; v_pb uuid; v_full uuid; v_g uuid; v_act activity_type; v_ca activity_type; v_n int;
  v_title text;
BEGIN
  SELECT user_id INTO v_admin FROM user_roles WHERE role = 'admin' LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'F28_06_FAIL setup: aucun admin'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);

  -- Source : Kitesurf à-la-carte dans un groupe Stage occupé (d0)
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F2806', 'f2806@test.invalid', 'Test', 'F2806', 'stage_100_glisse', 'stage', 5, 'active', now() + interval '1 year')
    RETURNING id INTO v_pkg;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d0, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_src;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id)
    VALUES (v_pkg, 'confirmed', 'regular', v_src) RETURNING id INTO v_pb;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_src, 'Kite', 'F2806', 'kite-f2806@test.invalid', '0600000000', 'debutant', 1, 'confirmed', 'kitesurf')
    RETURNING id INTO v_res;

  -- T1 : cible = Stage vide, aucun Kitesurf → groupe Kitesurf, jamais le Stage vide
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d1, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  PERFORM admin_reschedule_booking('visitor', v_res, d1, 'test');
  SELECT r.daily_group_id, g.activity INTO v_g, v_act FROM reservations r JOIN daily_groups g ON g.id = r.daily_group_id WHERE r.id = v_res;
  IF v_g = v_stage OR v_act <> 'kitesurf' THEN RAISE EXCEPTION 'F28_06_FAIL T1 Stage vide: % %', v_g, v_act; END IF;

  -- T2 : Stage occupé + capacité → autorisé
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d2, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg, 'confirmed', 'regular', v_stage);
  PERFORM admin_move_group_member('visitor', v_res, d2);
  SELECT daily_group_id INTO v_g FROM reservations WHERE id = v_res;
  IF v_g IS DISTINCT FROM v_stage THEN RAISE EXCEPTION 'F28_06_FAIL T2 Stage occupé: attendu % obtenu %', v_stage, v_g; END IF;

  -- T3 : groupe Kitesurf ouvert + Stage occupé → Kitesurf prioritaire
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d3, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg, 'confirmed', 'regular', v_stage);
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d3, 'kitesurf', 1, 4, 'open') RETURNING id INTO v_kite;
  PERFORM admin_reschedule_booking('visitor', v_res, d3, 'test');
  SELECT daily_group_id INTO v_g FROM reservations WHERE id = v_res;
  IF v_g IS DISTINCT FROM v_kite THEN RAISE EXCEPTION 'F28_06_FAIL T3 Kitesurf → Kitesurf: attendu % obtenu %', v_kite, v_g; END IF;

  -- T4 : aucun groupe → crée Kitesurf, jamais Stage
  PERFORM admin_move_group_member('visitor', v_res, d4);
  SELECT g.activity INTO v_act FROM reservations r JOIN daily_groups g ON g.id = r.daily_group_id WHERE r.id = v_res;
  SELECT count(*) INTO v_n FROM daily_groups WHERE date = d4 AND activity = 'stage_100_glisse';
  IF v_act <> 'kitesurf' OR v_n <> 0 THEN RAISE EXCEPTION 'F28_06_FAIL T4 création: % stage=%', v_act, v_n; END IF;

  -- T5 : pack Stage → reste Stage (inchangé)
  PERFORM admin_reschedule_booking('package', v_pb, d5, 'test');
  SELECT g.activity INTO v_act FROM package_bookings pb JOIN daily_groups g ON g.id = pb.daily_group_id WHERE pb.id = v_pb;
  IF v_act <> 'stage_100_glisse' THEN RAISE EXCEPTION 'F28_06_FAIL T5 Stage: %', v_act; END IF;

  -- T6 : Wingfoil → reste Wingfoil (inchangé)
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d0, 'wingfoil', 1, 3, 'open') RETURNING id INTO v_g;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status)
    VALUES (v_g, 'Wing', 'F2806', 'wing-f2806@test.invalid', '0600000000', 'debutant', 1, 'confirmed')
    RETURNING id INTO v_wres;
  PERFORM admin_reschedule_booking('visitor', v_wres, d1, 'test');
  SELECT g.activity, r.client_activity INTO v_act, v_ca FROM reservations r JOIN daily_groups g ON g.id = r.daily_group_id WHERE r.id = v_wres;
  IF v_act <> 'wingfoil' OR v_ca <> 'wingfoil' THEN RAISE EXCEPTION 'F28_06_FAIL T6 Wingfoil: % %', v_act, v_ca; END IF;

  -- T7 : groupe plein → refus par enforce_daily_group_capacity + rollback de l'opération
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d5, 'kitesurf', 9, 1, 'open') RETURNING id INTO v_full;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_full, 'Full', 'F2806', 'full-f2806@test.invalid', '0600000000', 'debutant', 1, 'confirmed', 'kitesurf');
  SELECT daily_group_id INTO v_g FROM reservations WHERE id = v_res;
  BEGIN
    UPDATE reservations SET daily_group_id = v_full WHERE id = v_res;
    RAISE EXCEPTION 'F28_06_FAIL T7 surcapacité acceptée';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'F28_06_FAIL%' THEN RAISE; END IF;
  END;
  IF (SELECT daily_group_id FROM reservations WHERE id = v_res) IS DISTINCT FROM v_g THEN
    RAISE EXCEPTION 'F28_06_FAIL T7 rollback incomplet'; END IF;

  -- T8 : client_activity reste kitesurf dans un groupe Stage ; libellé e-mail/notification = kitesurf
  PERFORM admin_reschedule_booking('visitor', v_res, d2, 'test-t8');
  SELECT r.client_activity, g.activity INTO v_ca, v_act FROM reservations r JOIN daily_groups g ON g.id = r.daily_group_id WHERE r.id = v_res;
  SELECT title INTO v_title FROM admin_notifications
   WHERE kind = 'booking_rescheduled' AND metadata->>'id' = v_res::text AND metadata->>'reason' = 'test-t8'
   ORDER BY created_at DESC LIMIT 1;
  IF v_ca <> 'kitesurf' OR v_act <> 'stage_100_glisse' OR v_title IS DISTINCT FROM 'Réservation reportée — kitesurf' THEN
    RAISE EXCEPTION 'F28_06_FAIL T8: ca=% groupe=% titre=%', v_ca, v_act, v_title; END IF;

  RAISE EXCEPTION 'F28_06_ALL_PASS';
END $$;
