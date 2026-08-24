-- LOT C-1 · MIGRATION B — garde base de données (niveau 2)
-- Contrôle bloquant : aucun doublon historique ne doit exister.
DO $$
DECLARE v_dupes int;
BEGIN
  SELECT count(*) INTO v_dupes FROM (
    SELECT booking_id
      FROM public.package_credit_history
     WHERE delta > 0 AND booking_id IS NOT NULL
     GROUP BY booking_id
    HAVING count(*) > 1
  ) t;
  IF v_dupes > 0 THEN
    RAISE EXCEPTION 'STOP C-1: % doublon(s) de recredit detecte(s), aucune donnee modifiee', v_dupes;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_pch_recredit_once
  ON public.package_credit_history (booking_id)
  WHERE delta > 0 AND booking_id IS NOT NULL;