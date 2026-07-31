ALTER TABLE public.crm_client_profiles
  ADD COLUMN IF NOT EXISTS marketing_consent_source text,
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_activities text[],
  ADD COLUMN IF NOT EXISTS test_credits integer,
  ADD COLUMN IF NOT EXISTS test_first_date date,
  ADD COLUMN IF NOT EXISTS test_last_date date;

INSERT INTO public.crm_client_profiles
  (email, first_name, last_name, phone, marketing_consent, marketing_consent_at,
   marketing_consent_source, is_test, test_activities, test_credits, test_first_date, test_last_date, tags)
VALUES
  ('test.brevo1@kitesurfpassion.fr','Test1','Validation','+33600000001', true, now(), 'TEST_VALIDATION', true, ARRAY['kitesurf'], 4, current_date - 200, current_date - 20, ARRAY['TEST_VALIDATION']),
  ('test.brevo2@kitesurfpassion.fr','Test2','Validation','+33600000002', true, now(), 'TEST_VALIDATION', true, ARRAY['wingfoil','pumpfoil'], 0, current_date - 500, current_date - 400, ARRAY['TEST_VALIDATION']),
  ('test.brevo3@kitesurfpassion.fr','Test3','Validation','+33600000003', true, now(), 'TEST_VALIDATION', true, ARRAY['foil_tracte'], 2, current_date - 90, current_date - 5, ARRAY['TEST_VALIDATION']),
  ('test.brevo4@kitesurfpassion.fr','Test4','Validation','+33600000004', true, now(), 'TEST_VALIDATION', true, ARRAY['stage_100_glisse','kitesurf'], 6, current_date - 60, current_date - 1, ARRAY['TEST_VALIDATION']),
  ('test.brevo5@kitesurfpassion.fr','Test5','Validation','+33600000005', true, now(), 'TEST_VALIDATION', true, ARRAY[]::text[], 0, NULL, NULL, ARRAY['TEST_VALIDATION'])
ON CONFLICT (email) DO UPDATE SET
  marketing_consent = true,
  marketing_consent_at = now(),
  marketing_consent_source = 'TEST_VALIDATION',
  is_test = true;