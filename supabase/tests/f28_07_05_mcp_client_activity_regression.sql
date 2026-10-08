-- F-28-07-05 — MCP list_my_reservations : activité = reservations.client_activity
-- Reproduit la lecture du MCP (même filtre user_id, même RLS en rôle authenticated,
-- même règle de mapping : client_activity ?? daily_groups.activity).
-- Données 2099 uniquement ; tout est annulé (exception sentinelle finale).
DO $$
DECLARE
  uA uuid := gen_random_uuid(); uB uuid := gen_random_uuid();
  g_kite uuid; g_stage uuid; g_wing uuid; g_pump uuid; g_foil uuid; v_pkg uuid;
  rk uuid; rks uuid; rs uuid; rw uuid; rp uuid; rf uuid; rn uuid; rc uuid; rb uuid;
  n_before int; n int; act text;
BEGIN
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES ('2099-07-01','kitesurf',1,4,'open') RETURNING id INTO g_kite;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES ('2099-07-01','stage_100_glisse',1,4,'open') RETURNING id INTO g_stage;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES ('2099-07-01','wingfoil',1,4,'open') RETURNING id INTO g_wing;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES ('2099-07-01','pumpfoil',1,4,'open') RETURNING id INTO g_pump;
  INSERT INTO daily_groups(date,activity,group_index,max_participants,status) VALUES ('2099-07-01','foil_tracte',1,4,'open') RETURNING id INTO g_foil;
  INSERT INTO client_packages(package_code,email,first_name,last_name,activity,package_type,total_sessions,used_sessions,status,expires_at)
  VALUES ('KP-2099-T705','f28-07-05@example.invalid','Stage','Test','stage_100_glisse','stage',5,1,'active','2099-12-31') RETURNING id INTO v_pkg;
  INSERT INTO package_bookings(package_id,status,booking_kind,daily_group_id) VALUES (v_pkg,'confirmed','regular',g_stage);

  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_kite,'kitesurf') RETURNING id INTO rk;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_stage,'kitesurf') RETURNING id INTO rks;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_stage,'stage_100_glisse') RETURNING id INTO rs;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_wing) RETURNING id INTO rw;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_pump) RETURNING id INTO rp;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',g_foil) RETURNING id INTO rf;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'confirmed',NULL,'kitesurf') RETURNING id INTO rn;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uA,'A','T','a@example.invalid','0','debutant',1,'cancelled',g_kite,'kitesurf') RETURNING id INTO rc;
  INSERT INTO reservations(user_id,first_name,last_name,email,phone,skill_level,participants,status,daily_group_id,client_activity) VALUES
   (uB,'B','T','b@example.invalid','0','debutant',1,'confirmed',g_kite,'kitesurf') RETURNING id INTO rb;

  -- Lecture « comme le MCP » : rôle authenticated, JWT de A, RLS active
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uA,'role','authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  CREATE TEMP TABLE mcp_out ON COMMIT DROP AS
    SELECT r.id, r.status, COALESCE(r.client_activity::text, dg.activity::text, 'kitesurf') AS activity
      FROM reservations r LEFT JOIN daily_groups dg ON dg.id = r.daily_group_id
     WHERE r.user_id = uA;

  SELECT count(*) INTO n FROM mcp_out;
  ASSERT n = 8, 'T1/T3 FAIL count='||n;                                         -- T1 + T3
  ASSERT NOT EXISTS (SELECT 1 FROM reservations WHERE id = rb), 'T2 FAIL (RLS B visible)'; -- T2
  ASSERT (SELECT status FROM mcp_out WHERE id = rc) = 'cancelled', 'T4 FAIL';  -- T4 (annulées toujours listées, comme avant)
  SELECT activity INTO act FROM mcp_out WHERE id = rk;  ASSERT act = 'kitesurf', 'T6 FAIL';
  SELECT activity INTO act FROM mcp_out WHERE id = rks; ASSERT act = 'kitesurf', 'T7 FAIL '||act;
  SELECT activity INTO act FROM mcp_out WHERE id = rs;  ASSERT act = 'stage_100_glisse', 'T8 FAIL';
  SELECT activity INTO act FROM mcp_out WHERE id = rw;  ASSERT act = 'wingfoil', 'T9 FAIL';
  SELECT activity INTO act FROM mcp_out WHERE id = rp;  ASSERT act = 'pumpfoil', 'T10 FAIL';
  SELECT activity INTO act FROM mcp_out WHERE id = rf;  ASSERT act = 'foil_tracte', 'T11 FAIL';
  SELECT activity INTO act FROM mcp_out WHERE id = rn;  ASSERT act = 'kitesurf', 'T12 FAIL (sans groupe)';
  -- T5 : le MCP n'a ni pagination ni limite ; inchangé (vérifié dans le code).

  RAISE EXCEPTION 'F28_07_05_ALL_PASS';
END $$;
