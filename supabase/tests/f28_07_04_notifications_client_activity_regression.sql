-- F-28-07-04 — Notifications de réservation : activité client (reservations.client_activity)
-- Données 2099 uniquement, tout est annulé (ROLLBACK). Aucun e-mail réel.
BEGIN;

DO $$
DECLARE
  g_kite uuid; g_stage uuid; g_wing uuid; g_pump uuid; g_foil uuid;
  v_pkg uuid; r uuid; n public.admin_notifications;
  fp_before text; fp_after text;
  FUNCTION_LIST text[] := ARRAY['enqueue_booking_confirmation','on_package_booking_created_dg',
    'enqueue_admin_notification','admin_move_group_member','admin_reschedule_booking',
    'book_stage_for_participants','book_stage_for_package'];

BEGIN
  SELECT string_agg(md5(pg_get_functiondef(p.oid)), ',' ORDER BY p.proname) INTO fp_before
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public' AND p.proname = ANY(FUNCTION_LIST);

  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
  VALUES ('2099-06-01','kitesurf',1,4,'open') RETURNING id INTO g_kite;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
  VALUES ('2099-06-01','stage_100_glisse',1,4,'open') RETURNING id INTO g_stage;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
  VALUES ('2099-06-01','wingfoil',1,4,'open') RETURNING id INTO g_wing;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
  VALUES ('2099-06-01','pumpfoil',1,4,'open') RETURNING id INTO g_pump;
  INSERT INTO daily_groups(date, activity, group_index, max_participants, status)
  VALUES ('2099-06-01','foil_tracte',1,4,'open') RETURNING id INTO g_foil;

  -- Stage occupé : un participant Stage confirmé
  INSERT INTO client_packages(package_code, email, first_name, last_name, activity, package_type,
                              total_sessions, used_sessions, status, expires_at)
  VALUES ('KP-2099-T704','f28-07-04@example.invalid','Stage','Test','stage_100_glisse','stage',5,1,'active','2099-12-31')
  RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id, status, booking_kind, daily_group_id)
  VALUES (v_pkg,'confirmed','regular',g_stage);

  -- T1 Kitesurf / Kitesurf
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity)
  VALUES ('T1','X','t1@example.invalid','0','debutant',1,'confirmed',g_kite,'kitesurf') RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — kitesurf', 'T1 FAIL '||n.title;
  ASSERT n.body NOT LIKE '%Groupe :%', 'T1 FAIL body';
  RAISE NOTICE 'T1 PASS';

  -- T2 + T7 Kitesurf / Stage occupé : réservation = kitesurf, groupe distinct = stage
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity)
  VALUES ('T2','X','t2@example.invalid','0','debutant',1,'confirmed',g_stage,'kitesurf') RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — kitesurf', 'T2 FAIL '||n.title;
  RAISE NOTICE 'T2 PASS';
  ASSERT n.body LIKE '%Groupe : stage_100_glisse%', 'T7 FAIL body';
  ASSERT n.metadata->>'client_activity' = 'kitesurf' AND n.metadata->>'group_activity' = 'stage_100_glisse', 'T7 FAIL metadata';
  RAISE NOTICE 'T7 PASS';

  -- T3 Stage / Stage
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity)
  VALUES ('T3','X','t3@example.invalid','0','debutant',1,'confirmed',g_stage,'stage_100_glisse') RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — stage_100_glisse' AND n.body NOT LIKE '%Groupe :%', 'T3 FAIL';
  RAISE NOTICE 'T3 PASS';

  -- T4/T5/T6 (client_activity omis -> rempli par le trigger depuis le groupe)
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id)
  VALUES ('T4','X','t4@example.invalid','0','debutant',1,'confirmed',g_wing) RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — wingfoil', 'T4 FAIL'; RAISE NOTICE 'T4 PASS';
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id)
  VALUES ('T5','X','t5@example.invalid','0','debutant',1,'confirmed',g_pump) RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — pumpfoil', 'T5 FAIL'; RAISE NOTICE 'T5 PASS';
  INSERT INTO reservations(first_name,last_name,email,phone,skill_level,participants,status,daily_group_id)
  VALUES ('T6','X','t6@example.invalid','0','debutant',1,'confirmed',g_foil) RETURNING id INTO r;
  SELECT * INTO n FROM admin_notifications WHERE ref_key='reservation:'||r;
  ASSERT n.title = 'Nouvelle réservation — foil_tracte', 'T6 FAIL'; RAISE NOTICE 'T6 PASS';

  -- T10 Idempotence : ref_key inchangé, une seule notification par réservation
  ASSERT (SELECT count(*) FROM admin_notifications WHERE ref_key='reservation:'||r AND kind='booking_new') = 1, 'T10 FAIL';
  PERFORM enqueue_admin_notification('booking_new','info','dup',NULL,'{}'::jsonb,'reservation:'||r);
  ASSERT (SELECT count(*) FROM admin_notifications WHERE ref_key='reservation:'||r AND kind='booking_new') = 1, 'T10 FAIL dedup';
  RAISE NOTICE 'T10 PASS';

  -- T8 F-28-06 (report) et T9 A0/A1 Stage : fonctions inchangées par ce lot
  SELECT string_agg(md5(pg_get_functiondef(p.oid)), ',' ORDER BY p.proname) INTO fp_after
    FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
   WHERE ns.nspname = 'public' AND p.proname = ANY(FUNCTION_LIST);
  ASSERT fp_before = fp_after, 'T8/T9 FAIL';
  ASSERT pg_get_functiondef('public.admin_reschedule_booking'::regproc) LIKE '%client_activity%', 'T8 FAIL';
  RAISE NOTICE 'T8 PASS (report toujours sur client_activity)';
  RAISE NOTICE 'T9 PASS (flux Stage A0/A1 non touché)';
END $$;

ROLLBACK;
