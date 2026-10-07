-- F-28-02_activity_group_compatibility
ALTER TABLE public.reservations ADD COLUMN client_activity public.activity_type;

UPDATE public.reservations r SET client_activity = g.activity
FROM public.daily_groups g WHERE g.id = r.daily_group_id AND r.client_activity IS NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.reservations WHERE client_activity IS NULL) THEN
    RAISE EXCEPTION 'F-28-02: backfill non deterministe, rollback';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reservations_default_client_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_activity IS NULL AND NEW.daily_group_id IS NOT NULL THEN
    SELECT activity INTO NEW.client_activity FROM public.daily_groups WHERE id = NEW.daily_group_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.reservations_default_client_activity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_reservations_default_client_activity
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.reservations_default_client_activity();

ALTER TABLE public.reservations ALTER COLUMN client_activity SET NOT NULL;

CREATE TABLE public.activity_group_compatibility (
  group_activity public.activity_type NOT NULL,
  allowed_client_activity public.activity_type NOT NULL,
  can_create_group boolean NOT NULL,
  PRIMARY KEY (group_activity, allowed_client_activity)
);
INSERT INTO public.activity_group_compatibility VALUES
 ('stage_100_glisse','kitesurf',false),
 ('kitesurf','kitesurf',true),
 ('wingfoil','wingfoil',true),
 ('pumpfoil','pumpfoil',true),
 ('foil_tracte','foil_tracte',true);

GRANT SELECT ON public.activity_group_compatibility TO authenticated;
GRANT ALL ON public.activity_group_compatibility TO service_role;
ALTER TABLE public.activity_group_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity compatibility" ON public.activity_group_compatibility
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));