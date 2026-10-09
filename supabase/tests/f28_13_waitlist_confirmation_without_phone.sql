-- F-28-13 — Confirmation d'offre de liste d'attente sans téléphone.
-- Dates 2099, tout est annulé par l'exception finale. Attendu : ERROR "F28_13_ALL_PASS".
-- Les e-mails mis en file pendant le test sont annulés avec la transaction (aucun envoi réel).
DO $$
DECLARE
  d1 date := '2099-04-06'; d2 date := '2099-04-07'; d3 date := '2099-04-08'; d4 date := '2099-04-09';
  v_pkg uuid; v_g uuid; v_r uuid; v_w uuid; v_ws uuid; v_tok text; v_j jsonb; v_n int; v_ph text; v_ca text; v_gid uuid;
BEGIN
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type, total_sessions, status, expires_at)
    VALUES ('TEST-F2813','f2813@test.invalid','Test','F2813','stage_100_glisse','stage',5,'active', now()+interval '1 year') RETURNING id INTO v_pkg;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d1,'kitesurf',1,4,'open') RETURNING id INTO v_g;

  -- T1 : téléphone renseigné → conservé tel quel
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d1,'kitesurf','A','F2813','a@test.invalid','0611111111',1,'offered', now()+interval '1 hour') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  SELECT phone INTO v_ph FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF NOT (v_j->>'ok')::boolean OR v_ph <> '0611111111' THEN RAISE EXCEPTION 'F28_13_FAIL T1: % %', v_j, v_ph; END IF;

  -- T2 : téléphone NULL → confirmation OK, téléphone ''
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d1,'kitesurf','B','F2813','b@test.invalid',NULL,1,'offered', now()+interval '1 hour') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  SELECT phone INTO v_ph FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF NOT coalesce((v_j->>'ok')::boolean,false) OR v_ph <> '' THEN RAISE EXCEPTION 'F28_13_FAIL T2: % %', v_j, v_ph; END IF;

  -- T7 : seconde confirmation du même jeton → 'already', aucune réservation en plus
  SELECT count(*) INTO v_n FROM reservations WHERE daily_group_id=v_g;
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF NOT coalesce((v_j->>'already')::boolean,false) OR (SELECT count(*) FROM reservations WHERE daily_group_id=v_g) <> v_n
    THEN RAISE EXCEPTION 'F28_13_FAIL T7: %', v_j; END IF;

  -- T3 : téléphone vide → confirmation OK, téléphone ''
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d1,'kitesurf','C','F2813','c@test.invalid','',1,'offered', now()+interval '1 hour') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  SELECT phone INTO v_ph FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF NOT coalesce((v_j->>'ok')::boolean,false) OR v_ph <> '' THEN RAISE EXCEPTION 'F28_13_FAIL T3: % %', v_j, v_ph; END IF;

  -- T8 : groupe plein (3 réservations + 1) → demande de 2 places refusée, pas de dépassement
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d1,'kitesurf','D','F2813','d@test.invalid',NULL,2,'offered', now()+interval '1 hour') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF v_j->>'error' <> 'no_capacity' THEN RAISE EXCEPTION 'F28_13_FAIL T8: %', v_j; END IF;
  IF (SELECT sum(participants) FROM reservations WHERE daily_group_id=v_g AND status<>'cancelled') > 4 THEN RAISE EXCEPTION 'F28_13_FAIL T8 surcapacité'; END IF;

  -- T4 : e-mail invalide → rejet inchangé à l'inscription
  v_j := join_waitlist(d4,'kitesurf','E','F2813','pas-un-email',NULL,1);
  IF v_j->>'error' <> 'invalid_email' THEN RAISE EXCEPTION 'F28_13_FAIL T4: %', v_j; END IF;

  -- T5 : jeton inconnu → rejet
  v_j := confirm_waitlist_offer(gen_random_uuid());
  IF v_j->>'error' <> 'invalid_token' THEN RAISE EXCEPTION 'F28_13_FAIL T5: %', v_j; END IF;

  -- T6 : offre expirée → rejet, aucune réservation
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d4,'kitesurf','F','F2813','f@test.invalid',NULL,1,'offered', now()-interval '1 minute') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  IF v_j->>'error' <> 'offer_expired' THEN RAISE EXCEPTION 'F28_13_FAIL T6: %', v_j; END IF;

  -- T9 + T11 : groupe Stage occupé, place libérée → offre Kitesurf ciblée prioritaire (Stage en attente), confirmation sans téléphone en Kitesurf
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d2,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',v_g);
  INSERT INTO reservations(daily_group_id, first_name, last_name, email, phone, skill_level, participants, status, client_activity)
    VALUES (v_g,'K','F2813','k@test.invalid','0600000000','debutant',3,'confirmed','kitesurf') RETURNING id INTO v_r;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, created_at)
    VALUES (d2,'stage_100_glisse','S','F2813','s@test.invalid',NULL,1, now()-interval '2 day') RETURNING id INTO v_ws;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, created_at)
    VALUES (d2,'kitesurf','K1','F2813','k1@test.invalid',NULL,1, now()-interval '1 day') RETURNING id INTO v_w;
  UPDATE reservations SET status='cancelled' WHERE id=v_r;
  IF (SELECT status FROM daily_waitlist WHERE id=v_w) <> 'offered' OR (SELECT offered_group_id FROM daily_waitlist WHERE id=v_w) IS DISTINCT FROM v_g
    THEN RAISE EXCEPTION 'F28_13_FAIL T11 priorité Kite'; END IF;
  IF (SELECT status FROM daily_waitlist WHERE id=v_ws) <> 'waiting' THEN RAISE EXCEPTION 'F28_13_FAIL T11 Stage servi avant Kite'; END IF;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  SELECT daily_group_id, client_activity::text, phone INTO v_gid, v_ca, v_ph FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF v_gid <> v_g OR v_ca <> 'kitesurf' OR v_ph <> '' THEN RAISE EXCEPTION 'F28_13_FAIL T9: % % % %', v_j, v_gid, v_ca, v_ph; END IF;

  -- T11 bis : aucun candidat Kitesurf → repli Stage (offre non ciblée)
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d3,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id) VALUES (v_pkg,'confirmed','regular',v_g);
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants)
    VALUES (d3,'stage_100_glisse','S3','F2813','s3@test.invalid',NULL,1) RETURNING id INTO v_ws;
  PERFORM notify_waitlist_for_group(v_g);
  IF (SELECT status FROM daily_waitlist WHERE id=v_ws) <> 'offered' OR (SELECT offered_group_id FROM daily_waitlist WHERE id=v_ws) IS NOT NULL
    THEN RAISE EXCEPTION 'F28_13_FAIL T11 bis repli'; END IF;

  -- T10 : groupe Stage vide → jamais proposé au Kitesurf, aucun groupe créé
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d4,'stage_100_glisse',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants)
    VALUES (d4,'kitesurf','K10','F2813','k10@test.invalid',NULL,1) RETURNING id INTO v_w;
  PERFORM notify_waitlist_for_group(v_g);
  IF (SELECT status FROM daily_waitlist WHERE id=v_w) <> 'waiting' THEN RAISE EXCEPTION 'F28_13_FAIL T10'; END IF;
  IF EXISTS (SELECT 1 FROM daily_groups WHERE date=d4 AND id<>v_g) THEN RAISE EXCEPTION 'F28_13_FAIL T10 groupe créé'; END IF;

  -- T12 : Wingfoil sans téléphone → confirmation dans un groupe Wingfoil, activité Wingfoil
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status) VALUES (d1,'wingfoil',1,4,'open') RETURNING id INTO v_g;
  INSERT INTO daily_waitlist(date, activity, first_name, last_name, email, phone, participants, status, offer_expires_at)
    VALUES (d1,'wingfoil','W','F2813','w@test.invalid',NULL,1,'offered', now()+interval '1 hour') RETURNING id INTO v_w;
  v_tok := issue_link_token('waitlist_offer', v_w::text, now()+interval '1 hour');
  v_j := confirm_waitlist_offer(v_tok::uuid);
  SELECT daily_group_id, client_activity::text INTO v_gid, v_ca FROM reservations WHERE id=(v_j->>'reservation_id')::uuid;
  IF v_gid <> v_g OR v_ca <> 'wingfoil' THEN RAISE EXCEPTION 'F28_13_FAIL T12: %', v_j; END IF;

  RAISE EXCEPTION 'F28_13_ALL_PASS';
END $$;
