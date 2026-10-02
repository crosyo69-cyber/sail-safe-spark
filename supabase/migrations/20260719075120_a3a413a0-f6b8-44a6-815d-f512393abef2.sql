
-- Automated session generation over a rolling 365-day horizon.
-- Inserts default kitesurf sessions (morning + early_afternoon) 7 days a week
-- for the next N days, skipping dates that already have a session for that slot.
CREATE OR REPLACE FUNCTION public.auto_generate_sessions(p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start date := CURRENT_DATE;
  v_end   date := CURRENT_DATE + (p_days - 1);
  v_created int;
BEGIN
  WITH inserted AS (
    INSERT INTO public.sessions (date, time_slot, activity, max_participants, status)
    SELECT d::date, s::time_slot, 'kitesurf'::activity_type, 4, 'open'
    FROM generate_series(v_start, v_end, interval '1 day') AS d
    CROSS JOIN (VALUES ('morning'), ('early_afternoon')) AS slots(s)
    ON CONFLICT (date, time_slot, activity) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_created FROM inserted;

  RETURN jsonb_build_object(
    'ok', true,
    'start', v_start,
    'end', v_end,
    'created', v_created
  );
END;
$$;

-- Schedule daily at 03:15 UTC to keep the rolling 365-day window filled.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-sessions-daily') THEN
    PERFORM cron.unschedule('auto-generate-sessions-daily');
  END IF;
  PERFORM cron.schedule(
    'auto-generate-sessions-daily',
    '15 3 * * *',
    $cron$ SELECT public.auto_generate_sessions(365); $cron$
  );
END $$;

-- Seed immediately so the horizon is filled without waiting for the next cron tick.
SELECT public.auto_generate_sessions(365);
