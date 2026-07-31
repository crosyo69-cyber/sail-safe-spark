-- 1) Backfill des fiches CRM pour tous les clients existants
INSERT INTO public.crm_client_profiles (email, first_name, last_name, phone, marketing_consent, marketing_consent_source, is_test)
SELECT b.email, b.first_name, b.last_name, b.phone, false, 'BACKFILL_2026', false
FROM public.crm_client_base() b
WHERE b.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_client_profiles p WHERE lower(p.email) = lower(b.email)
  );

-- 2) Création automatique à l'avenir
CREATE OR REPLACE FUNCTION public.ensure_crm_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.crm_client_profiles (email, first_name, last_name, phone, marketing_consent, marketing_consent_source, is_test)
  VALUES (lower(NEW.email), NEW.first_name, NEW.last_name, NEW.phone, false, 'AUTO_CREATE', false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_crm_profile_reservations ON public.reservations;
CREATE TRIGGER trg_ensure_crm_profile_reservations
AFTER INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.ensure_crm_profile();

DROP TRIGGER IF EXISTS trg_ensure_crm_profile_packages ON public.client_packages;
CREATE TRIGGER trg_ensure_crm_profile_packages
AFTER INSERT ON public.client_packages
FOR EACH ROW EXECUTE FUNCTION public.ensure_crm_profile();