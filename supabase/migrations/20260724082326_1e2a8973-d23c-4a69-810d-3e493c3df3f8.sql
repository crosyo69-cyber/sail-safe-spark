-- 1) Désactiver le cron de pré-génération
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-sessions-daily') THEN
    PERFORM cron.unschedule('auto-generate-sessions-daily');
  END IF;
END $$;

-- 2) Supprimer les sessions kitesurf futures vides (aucune réservation ni booking pack)
DELETE FROM public.sessions s
WHERE s.activity = 'kitesurf'
  AND s.date >= CURRENT_DATE
  AND s.status = 'open'
  AND COALESCE(s.notes, '') NOT ILIKE '%auto-créée via sync Stripe%'
  AND NOT EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.session_id = s.id AND r.status <> 'cancelled'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.package_bookings pb
    WHERE pb.session_id = s.id AND pb.status = 'confirmed'
  );