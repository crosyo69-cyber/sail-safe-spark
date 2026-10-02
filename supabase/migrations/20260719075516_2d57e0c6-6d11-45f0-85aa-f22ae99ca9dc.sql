-- Table de journal des exécutions de génération automatique
CREATE TABLE IF NOT EXISTS public.session_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  created_count int NOT NULL DEFAULT 0,
  expected_min int NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.session_generation_runs TO authenticated;
GRANT ALL ON public.session_generation_runs TO service_role;

ALTER TABLE public.session_generation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read session generation runs"
  ON public.session_generation_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Wrapper avec alertes
CREATE OR REPLACE FUNCTION public.auto_generate_sessions_monitored(p_days int DEFAULT 365, p_expected_min int DEFAULT 2)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_created int;
  v_err text;
BEGIN
  BEGIN
    v_result := public.auto_generate_sessions(p_days);
    v_created := COALESCE((v_result->>'created')::int, 0);

    INSERT INTO public.session_generation_runs (ok, created_count, expected_min, metadata)
    VALUES (true, v_created, p_expected_min, v_result);

    IF v_created < p_expected_min THEN
      INSERT INTO public.admin_notifications (kind, severity, title, body, metadata, ref_key)
      VALUES (
        'session_generation',
        'warning',
        '⚠️ Génération de sessions sous le seuil attendu',
        format('La génération planifiée n''a créé que %s session(s) alors que le seuil minimum est de %s. Vérifiez que le cron tourne bien et que les créneaux sont configurés.', v_created, p_expected_min),
        jsonb_build_object('created', v_created, 'expected_min', p_expected_min, 'result', v_result),
        'session_generation_low_' || to_char(now(), 'YYYY-MM-DD')
      )
      ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;

    INSERT INTO public.session_generation_runs (ok, created_count, expected_min, error_message)
    VALUES (false, 0, p_expected_min, v_err);

    INSERT INTO public.admin_notifications (kind, severity, title, body, metadata, ref_key)
    VALUES (
      'session_generation',
      'critical',
      '🚨 Échec de la génération automatique des sessions',
      format('La génération planifiée a échoué : %s. Le calendrier de réservation ne sera plus rempli tant que le problème persistera.', v_err),
      jsonb_build_object('error', v_err),
      'session_generation_error_' || to_char(now(), 'YYYY-MM-DD"T"HH24')
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('ok', false, 'error', v_err);
  END;
END;
$$;

-- Remplacer le cron pour appeler la version monitored
SELECT cron.unschedule('auto-generate-sessions-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-sessions-daily');

SELECT cron.schedule(
  'auto-generate-sessions-daily',
  '15 3 * * *',
  $$SELECT public.auto_generate_sessions_monitored(365, 2);$$
);