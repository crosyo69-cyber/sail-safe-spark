-- F-28-09 — Non-régression liste d'attente (activité client vs groupe).
-- Dates 2099, tout est annulé par l'exception finale. Attendu : ERROR "F28_09_ALL_PASS".
-- Les e-mails mis en file pendant le test sont annulés avec la transaction (aucun envoi réel).
DO $$
DECLARE
  d1 date := '2099-03-02'; d2 date := '2099-03-03'; d3 date := '2099-03-04';
  d4 date := '2099-03-05'; d5 date := '2099-03-06'; d6 date := '2099-03-09';
  v_pkg uuid; v_g uuid; v_g2 uuid; v_r uuid; v_w1 uuid; v_w2 uuid; v_ws uuid;
  v_tok text; v_j jsonb; v_n int; v_s text; v_gid uuid; v_ca text; v_res_before int;
BEGIN
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F2809', 'f2809@test.invalid', 'Test', 'F2809', 'stage_100_glisse', 'stage', 5, 'active', now() + interval '1 year')
    RETURNING id INTO v_pkg;

  -- T1 : groupe Kitesurf normal → liste Kitesurf (comportement inchangé)
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d1,'kitesurf',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    SELECT v_g,'R'||i,'F2809','r'||i||'@test.invalid','0600000000','debutant',1,'confirmed','kitesurf' FROM generate_series(1,4) i;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants) VALUES (d1,'kitesurf','W1','F2809','w1@test.invalid',1) RETURNING id INTO v_w1;
  UPDATE reservations SET status='cancelled' WHERE id = (SELECT id FROM reservations WHERE daily_group_id=v_g LIMIT 1);
  SELECT status INTO v_s FROM daily_waitlist WHERE id=v_w1;
  IF v_s <> 'offered' THEN RAISE EXCEPTION 'F28_09_FAIL T1: %', v_s; END IF;

  -- T2 + T3 : groupe Stage occupé, place Kite libérée → liste Kitesurf prioritaire, FIFO préservé
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d2,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',v_g);
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_g,'K','F2809','k@test.invalid','0600000000','debutant',1,'confirmed','kitesurf') RETURNING id INTO v_r;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_g,'Kb','F2809','kb@test.invalid','0600000000','debutant',2,'confirmed','kitesurf'); -- groupe plein (1 Stage + 3 Kite)
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants, created_at) VALUES (d2,'stage_100_glisse','S','F2809','s@test.invalid',1, now()-interval '3 day') RETURNING id INTO v_ws;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants, created_at) VALUES (d2,'kitesurf','K1','F2809','k1@test.invalid',1, now()-interval '2 day') RETURNING id INTO v_w1;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants, created_at) VALUES (d2,'kitesurf','K2','F2809','k2@test.invalid',1, now()-interval '1 day') RETURNING id INTO v_w2;
  UPDATE reservations SET status='cancelled' WHERE id = v_r;
  IF (SELECT status FROM daily_waitlist WHERE id=v_w1) <> 'offered' THEN RAISE EXCEPTION 'F28_09_FAIL T2: Kite non prioritaire'; END IF;
  IF (SELECT offered_group_id FROM daily_waitlist WHERE id=v_w1) IS DISTINCT FROM v_g THEN RAISE EXCEPTION 'F28_09_FAIL T2: groupe cible'; END IF;
  IF (SELECT status FROM daily_waitlist WHERE id=v_ws) <> 'waiting' THEN RAISE EXCEPTION 'F28_09_FAIL T2: Stage servi avant Kite'; END IF;
  IF (SELECT status FROM daily_waitlist WHERE id=v_w2) <> 'waiting' THEN RAISE EXCEPTION 'F28_09_FAIL T3: FIFO'; END IF;

  -- T9 : relance → pas de seconde offre
  PERFORM notify_waitlist_for_group(v_g);
  SELECT count(*) INTO v_n FROM daily_waitlist WHERE date=d2 AND status='offered';
  IF v_n <> 1 THEN RAISE EXCEPTION 'F28_09_FAIL T9 idempotence offre: %', v_n; END IF;
  PERFORM offer_waitlist_spot_in(d2, 'stage_100_glisse', NULL); -- chemin du cycle périodique
  IF (SELECT status FROM daily_waitlist WHERE id=v_ws) <> 'waiting' THEN RAISE EXCEPTION 'F28_09_FAIL T9 cycle: place offerte deux fois'; END IF;

  -- T7 : confirmation → réservation Kitesurf dans le groupe Stage ciblé
  v_tok := issue_link_token('waitlist_offer', v_w1::text, now() + interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF NOT (v_j->>'ok')::boolean THEN RAISE EXCEPTION 'F28_09_FAIL T7: %', v_j; END IF;
  SELECT daily_group_id, client_activity::text INTO v_gid, v_ca FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF v_gid <> v_g OR v_ca <> 'kitesurf' THEN RAISE EXCEPTION 'F28_09_FAIL T7 groupe/activité: % %', v_gid, v_ca; END IF;

  -- T9 bis : double confirmation → aucune réservation en plus
  SELECT count(*) INTO v_res_before FROM reservations WHERE daily_group_id=v_g AND status<>'cancelled';
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF NOT coalesce((v_j->>'already')::boolean,false) THEN RAISE EXCEPTION 'F28_09_FAIL T9 bis: %', v_j; END IF;
  IF (SELECT count(*) FROM reservations WHERE daily_group_id=v_g AND status<>'cancelled') <> v_res_before THEN RAISE EXCEPTION 'F28_09_FAIL T9 bis doublon'; END IF;

  -- T4 : aucun candidat Kitesurf → repli documenté : liste Stage du jour (comportement antérieur)
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d3,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',v_g);
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants) VALUES (d3,'stage_100_glisse','S3','F2809','s3@test.invalid',1) RETURNING id INTO v_ws;
  v_j := notify_waitlist_for_group(v_g);
  IF (SELECT status FROM daily_waitlist WHERE id=v_ws) <> 'offered' OR (SELECT offered_group_id FROM daily_waitlist WHERE id=v_ws) IS NOT NULL
    THEN RAISE EXCEPTION 'F28_09_FAIL T4 repli: %', v_j; END IF;

  -- T5 : groupe Stage vide → jamais d'offre Kitesurf
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d4,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants) VALUES (d4,'kitesurf','K5','F2809','k5@test.invalid',1) RETURNING id INTO v_w1;
  PERFORM notify_waitlist_for_group(v_g);
  IF (SELECT status FROM daily_waitlist WHERE id=v_w1) <> 'waiting' THEN RAISE EXCEPTION 'F28_09_FAIL T5 Stage vide offert au Kite'; END IF;
  IF EXISTS (SELECT 1 FROM daily_groups WHERE date=d4 AND id<>v_g) THEN RAISE EXCEPTION 'F28_09_FAIL T5 groupe créé'; END IF;

  -- T6 : capacité — demande 2 places pour 1 libre dans Stage occupé → aucune offre
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d5,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',v_g);
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_g,'K6','F2809','k6@test.invalid','0600000000','debutant',2,'confirmed','kitesurf');
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants) VALUES (d5,'kitesurf','K6b','F2809','k6b@test.invalid',2) RETURNING id INTO v_w1;
  PERFORM notify_waitlist_for_group(v_g);
  IF (SELECT status FROM daily_waitlist WHERE id=v_w1) <> 'waiting' THEN RAISE EXCEPTION 'F28_09_FAIL T6 surcapacité'; END IF;

  -- T8 : offre expirée → refus, aucune réservation
  UPDATE daily_waitlist SET status='offered', offered_at=now()-interval '3 hour', offer_expires_at=now()-interval '1 hour', offered_group_id=v_g WHERE id=v_w1;
  v_tok := issue_link_token('waitlist_offer', v_w1::text, now() + interval '1 hour');
  SELECT count(*) INTO v_res_before FROM reservations;
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF v_j->>'error' <> 'offer_expired' OR (SELECT count(*) FROM reservations) <> v_res_before THEN RAISE EXCEPTION 'F28_09_FAIL T8: %', v_j; END IF;

  -- T12 : jeton inconnu / d'un autre client → invalid_token
  v_j := confirm_waitlist_offer(gen_random_uuid());
  IF v_j->>'error' <> 'invalid_token' THEN RAISE EXCEPTION 'F28_09_FAIL T12: %', v_j; END IF;

  -- T10 : Wingfoil inchangé
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d6,'wingfoil',1,3,'open') RETURNING id INTO v_g2;
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_g2,'Wg','F2809','wg@test.invalid','0600000000','debutant',3,'confirmed','wingfoil') RETURNING id INTO v_r;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, participants) VALUES (d6,'wingfoil','Wf','F2809','wf@test.invalid',1) RETURNING id INTO v_w1;
  UPDATE reservations SET status='cancelled' WHERE id=v_r;
  IF (SELECT status FROM daily_waitlist WHERE id=v_w1) <> 'offered' OR (SELECT offered_group_id FROM daily_waitlist WHERE id=v_w1) IS NOT NULL
    THEN RAISE EXCEPTION 'F28_09_FAIL T10 wingfoil'; END IF;

  RAISE EXCEPTION 'F28_09_ALL_PASS';
END $$;
