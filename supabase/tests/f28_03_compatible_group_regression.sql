-- F-28-03 — Test de non-régression : find_or_create_compatible_group
-- Lecture seule de fait : tout est annulé par l'exception finale (rollback automatique).
-- Résultat attendu : ERROR "F28_03_ALL_PASS ..." ; tout échec lève "F28_03_FAIL ...".
-- Dates en 2099 : aucun groupe réel ce jour-là.
DO $$
DECLARE
  d1 date := '2099-01-05'; d2 date := '2099-01-06'; d3 date := '2099-01-07';
  v_stage uuid; v_kite uuid; v_pkg uuid; v_ret uuid; v_act activity_type; v_n int;
BEGIN
  -- T1 : Stage vide (0 confirmé) + aucun groupe Kitesurf → groupe Kitesurf, Stage jamais choisi
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d1, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  v_ret := find_or_create_compatible_group(d1, 'kitesurf', 1);
  SELECT activity INTO v_act FROM daily_groups WHERE id = v_ret;
  IF v_ret = v_stage OR v_act <> 'kitesurf' THEN
    RAISE EXCEPTION 'F28_03_FAIL T1 Stage vide: groupe % activité %', v_ret, v_act; END IF;

  -- T2 : Stage avec 1 stagiaire confirmé + place → Kitesurf rejoint Stage
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d2, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F2803', 'f2803@test.invalid', 'Test', 'F2803', 'stage_100_glisse', 'stage', 5, 'active', now() + interval '1 year')
    RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id)
    VALUES (v_pkg, 'confirmed', 'regular', v_stage);
  v_ret := find_or_create_compatible_group(d2, 'kitesurf', 1);
  IF v_ret IS DISTINCT FROM v_stage THEN
    RAISE EXCEPTION 'F28_03_FAIL T2 Stage occupé: attendu %, obtenu %', v_stage, v_ret; END IF;

  -- T3 : groupe Kitesurf ouvert + Stage occupé → Kitesurf prioritaire
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d3, 'stage_100_glisse', 1, 4, 'open') RETURNING id INTO v_stage;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id)
    VALUES (v_pkg, 'confirmed', 'regular', v_stage);
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
    VALUES (d3, 'kitesurf', 1, 4, 'open') RETURNING id INTO v_kite;
  v_ret := find_or_create_compatible_group(d3, 'kitesurf', 1);
  IF v_ret IS DISTINCT FROM v_kite THEN
    RAISE EXCEPTION 'F28_03_FAIL T3 priorité Kitesurf: attendu %, obtenu %', v_kite, v_ret; END IF;

  -- T4 : Kitesurf n'a créé aucun groupe Stage (seuls les 3 insérés par le test existent)
  SELECT count(*) INTO v_n FROM daily_groups
   WHERE date IN (d1, d2, d3) AND activity = 'stage_100_glisse';
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'F28_03_FAIL T4 groupes Stage créés: % (attendu 3)', v_n; END IF;

  RAISE EXCEPTION 'F28_03_ALL_PASS T1 T2 T3 T4 (rollback automatique)';
END $$;
