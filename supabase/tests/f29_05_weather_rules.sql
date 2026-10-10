-- F-29-05 — Règles météo par activité. Tout est annulé par l'exception finale.
-- Attendu : ERROR "F29_05_ALL_PASS". Aucun envoi, aucune réservation touchée.
DO $$
DECLARE
  v_admin uuid; v_r weather_activity_rules; v_n int; v_h weather_activity_rules_history; v_ok boolean;
  v_before weather_activity_rules;
BEGIN
  -- T1-T3 / T7 : valeurs initiales exactes, NULL ≠ 0
  PERFORM 1 FROM weather_activity_rules WHERE activity='kitesurf' AND min_wind_kn=12 AND max_wind_kn=30 AND max_gust_kn=35 AND enabled;
  IF NOT FOUND THEN RAISE EXCEPTION 'F29_05_FAIL T1 kitesurf'; END IF;
  PERFORM 1 FROM weather_activity_rules WHERE activity='wingfoil' AND min_wind_kn=10 AND max_wind_kn=30 AND max_gust_kn=35 AND enabled;
  IF NOT FOUND THEN RAISE EXCEPTION 'F29_05_FAIL T1 wingfoil'; END IF;
  PERFORM 1 FROM weather_activity_rules WHERE activity='pumpfoil' AND min_wind_kn IS NULL AND max_wind_kn IS NULL AND max_gust_kn=5;
  IF NOT FOUND THEN RAISE EXCEPTION 'F29_05_FAIL T2 pumpfoil'; END IF;
  PERFORM 1 FROM weather_activity_rules WHERE activity='foil_tracte' AND min_wind_kn IS NULL AND max_wind_kn=5 AND max_gust_kn=5;
  IF NOT FOUND THEN RAISE EXCEPTION 'F29_05_FAIL T3 foil_tracte'; END IF;
  SELECT count(*) INTO v_n FROM weather_activity_rules;
  IF v_n <> 4 THEN RAISE EXCEPTION 'F29_05_FAIL T1 count %', v_n; END IF;

  SELECT user_id INTO v_admin FROM user_roles WHERE role='admin' LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'F29_05_FAIL no admin to simulate'; END IF;

  -- T9 : non-admin ne peut pas modifier
  PERFORM set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role','authenticated')::text, true);
  BEGIN
    PERFORM admin_update_weather_rule('kitesurf',12,30,35,true,'x');
    RAISE EXCEPTION 'F29_05_FAIL T9 non-admin write accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  -- T9 : non-admin ne peut pas lire (RLS)
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO v_n FROM weather_activity_rules;
  SELECT count(*) INTO v_n FROM (SELECT 1 FROM weather_activity_rules UNION ALL SELECT 1 FROM weather_activity_rules_history) s
    WHERE v_n > 0;
  EXECUTE 'RESET ROLE';
  IF v_n <> 0 THEN RAISE EXCEPTION 'F29_05_FAIL T9 non-admin read %', v_n; END IF;
  -- anonyme : aucun droit d'exécution
  SELECT has_function_privilege('anon','public.admin_update_weather_rule(activity_type,numeric,numeric,numeric,boolean,text)','EXECUTE') INTO v_ok;
  IF v_ok THEN RAISE EXCEPTION 'F29_05_FAIL T9 anon execute'; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role','authenticated')::text, true);
  SELECT * INTO v_before FROM weather_activity_rules WHERE activity='kitesurf';

  -- T4 : égalité min = max acceptée
  v_r := admin_update_weather_rule('kitesurf',20,20,20,true,'test égalité');
  IF v_r.min_wind_kn <> 20 OR v_r.max_wind_kn <> 20 THEN RAISE EXCEPTION 'F29_05_FAIL T4'; END IF;

  -- T5 : négatif / infini / NaN rejetés ; T6 : min > max ; T8 : motif vide ; gust NULL
  BEGIN PERFORM admin_update_weather_rule('kitesurf',-1,30,35,true,'r'); RAISE EXCEPTION 'F29_05_FAIL T5 neg';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM admin_update_weather_rule('kitesurf',12,'Infinity',35,true,'r'); RAISE EXCEPTION 'F29_05_FAIL T5 inf';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM admin_update_weather_rule('kitesurf',12,30,'NaN',true,'r'); RAISE EXCEPTION 'F29_05_FAIL T5 nan';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM admin_update_weather_rule('kitesurf',31,30,35,true,'r'); RAISE EXCEPTION 'F29_05_FAIL T6';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM admin_update_weather_rule('kitesurf',12,30,35,true,'   '); RAISE EXCEPTION 'F29_05_FAIL T8';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN PERFORM admin_update_weather_rule('kitesurf',12,30,NULL,true,'r'); RAISE EXCEPTION 'F29_05_FAIL gust null';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  -- T10/T12 : échecs sans effet sur la valeur enregistrée
  SELECT * INTO v_r FROM weather_activity_rules WHERE activity='kitesurf';
  IF v_r.min_wind_kn <> 20 THEN RAISE EXCEPTION 'F29_05_FAIL T12 persisted changed'; END IF;
  -- non-texte : activité hors périmètre rejetée
  BEGIN PERFORM admin_update_weather_rule('stage_100_glisse',1,2,3,true,'r'); RAISE EXCEPTION 'F29_05_FAIL scope';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;

  -- T7 : NULL reste NULL (pas 0)
  v_r := admin_update_weather_rule('pumpfoil',NULL,NULL,5,true,'test null');
  IF v_r.min_wind_kn IS NOT NULL OR v_r.max_wind_kn IS NOT NULL THEN RAISE EXCEPTION 'F29_05_FAIL T7'; END IF;

  -- T11 : auteur, horodatage, motif ; historique immuable
  SELECT * INTO v_h FROM weather_activity_rules_history WHERE activity='kitesurf' ORDER BY changed_at DESC, id DESC LIMIT 1;
  IF v_h.changed_by <> v_admin OR v_h.change_reason <> 'test égalité' OR v_h.changed_at IS NULL
     OR (v_h.old_values->>'min_wind_kn')::numeric <> v_before.min_wind_kn THEN
    RAISE EXCEPTION 'F29_05_FAIL T11 %', row_to_json(v_h); END IF;
  SELECT * INTO v_r FROM weather_activity_rules WHERE activity='kitesurf';
  IF v_r.updated_by <> v_admin OR v_r.change_reason <> 'test égalité' THEN RAISE EXCEPTION 'F29_05_FAIL T11 row'; END IF;
  BEGIN UPDATE weather_activity_rules_history SET change_reason='x' WHERE id=v_h.id; RAISE EXCEPTION 'F29_05_FAIL T11 mutable';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'F29_05_FAIL%' THEN RAISE; END IF; END;

  RAISE EXCEPTION 'F29_05_ALL_PASS';
END $$;
