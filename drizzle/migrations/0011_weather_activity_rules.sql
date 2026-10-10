CREATE TABLE public.weather_activity_rules (
  activity public.activity_type PRIMARY KEY
    CHECK (activity IN ('kitesurf','wingfoil','pumpfoil','foil_tracte')),
  min_wind_kn numeric NULL CHECK (min_wind_kn IS NULL OR (min_wind_kn >= 0 AND min_wind_kn < 'Infinity'::numeric)),
  max_wind_kn numeric NULL CHECK (max_wind_kn IS NULL OR (max_wind_kn >= 0 AND max_wind_kn < 'Infinity'::numeric)),
  max_gust_kn numeric NOT NULL CHECK (max_gust_kn >= 0 AND max_gust_kn < 'Infinity'::numeric),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL,
  updated_by_email text NULL,
  change_reason text NOT NULL CHECK (length(btrim(change_reason)) > 0),
  CONSTRAINT weather_rules_min_le_max CHECK (min_wind_kn IS NULL OR max_wind_kn IS NULL OR min_wind_kn <= max_wind_kn)
);
COMMENT ON TABLE public.weather_activity_rules IS 'F-29-05: per-activity weather thresholds (knots, bounds inclusive). NULL = criterion not applicable, never zero. Decision support only.';
GRANT SELECT ON public.weather_activity_rules TO authenticated;
GRANT ALL ON public.weather_activity_rules TO service_role;
ALTER TABLE public.weather_activity_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read weather rules" ON public.weather_activity_rules
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.weather_activity_rules_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity public.activity_type NOT NULL,
  old_values jsonb NULL,
  new_values jsonb NOT NULL,
  changed_by uuid NULL,
  changed_by_email text NULL,
  change_reason text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weather_activity_rules_history TO authenticated;
GRANT SELECT, INSERT ON public.weather_activity_rules_history TO service_role;
ALTER TABLE public.weather_activity_rules_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read weather rules history" ON public.weather_activity_rules_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.weather_rules_history_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'weather_activity_rules_history is append-only'; END $$;
CREATE TRIGGER weather_rules_history_no_update BEFORE UPDATE OR DELETE ON public.weather_activity_rules_history
  FOR EACH ROW EXECUTE FUNCTION public.weather_rules_history_immutable();

CREATE OR REPLACE FUNCTION public.weather_rules_log_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO weather_activity_rules_history(activity, old_values, new_values, changed_by, changed_by_email, change_reason)
  VALUES (NEW.activity,
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('min_wind_kn',OLD.min_wind_kn,'max_wind_kn',OLD.max_wind_kn,'max_gust_kn',OLD.max_gust_kn,'enabled',OLD.enabled) END,
    jsonb_build_object('min_wind_kn',NEW.min_wind_kn,'max_wind_kn',NEW.max_wind_kn,'max_gust_kn',NEW.max_gust_kn,'enabled',NEW.enabled),
    NEW.updated_by, NEW.updated_by_email, NEW.change_reason);
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.weather_rules_log_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER weather_rules_audit AFTER INSERT OR UPDATE ON public.weather_activity_rules
  FOR EACH ROW EXECUTE FUNCTION public.weather_rules_log_change();

CREATE OR REPLACE FUNCTION public.admin_update_weather_rule(
  p_activity public.activity_type, p_min_wind_kn numeric, p_max_wind_kn numeric,
  p_max_gust_kn numeric, p_enabled boolean, p_reason text)
RETURNS public.weather_activity_rules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_email text; v_row weather_activity_rules;
BEGIN
  IF v_uid IS NULL OR NOT has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Motif de modification obligatoire' USING ERRCODE = '22023';
  END IF;
  IF p_max_gust_kn IS NULL THEN RAISE EXCEPTION 'Rafales maximum obligatoires' USING ERRCODE = '22023'; END IF;
  IF p_enabled IS NULL THEN RAISE EXCEPTION 'État activé/désactivé obligatoire' USING ERRCODE = '22023'; END IF;
  IF (p_min_wind_kn IS NOT NULL AND (p_min_wind_kn < 0 OR p_min_wind_kn = 'Infinity' OR p_min_wind_kn = 'NaN'))
     OR (p_max_wind_kn IS NOT NULL AND (p_max_wind_kn < 0 OR p_max_wind_kn = 'Infinity' OR p_max_wind_kn = 'NaN'))
     OR p_max_gust_kn < 0 OR p_max_gust_kn = 'Infinity' OR p_max_gust_kn = 'NaN' THEN
    RAISE EXCEPTION 'Seuils invalides : nombres finis positifs ou nuls attendus' USING ERRCODE = '22023';
  END IF;
  IF p_min_wind_kn IS NOT NULL AND p_max_wind_kn IS NOT NULL AND p_min_wind_kn > p_max_wind_kn THEN
    RAISE EXCEPTION 'Le vent minimum ne peut pas dépasser le vent maximum' USING ERRCODE = '22023';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  UPDATE weather_activity_rules SET
    min_wind_kn = p_min_wind_kn, max_wind_kn = p_max_wind_kn, max_gust_kn = p_max_gust_kn,
    enabled = p_enabled, change_reason = btrim(p_reason),
    updated_by = v_uid, updated_by_email = v_email, updated_at = now()
  WHERE activity = p_activity RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Activité non configurable' USING ERRCODE = '22023'; END IF;
  RETURN v_row;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_weather_rule(public.activity_type, numeric, numeric, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_weather_rule(public.activity_type, numeric, numeric, numeric, boolean, text) TO authenticated;