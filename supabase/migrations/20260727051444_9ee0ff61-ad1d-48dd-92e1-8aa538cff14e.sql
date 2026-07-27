DO $$
DECLARE
  v_row RECORD;
  v_group_id UUID;
  v_new_idx INT;
  v_needed INT;
  v_archives_created INT := 0;
  v_res_migrated INT := 0;
  v_pkg_migrated INT := 0;
  v_res_detached INT := 0;
  v_pkg_detached INT := 0;
  v_res_left INT;
  v_pkg_left INT;
BEGIN
  -- 1. Créer / élargir les groupes d'archive
  FOR v_row IN
    SELECT s.date, s.activity,
           COALESCE(SUM(load.seats),0) AS total_seats,
           MAX(s.max_participants) AS legacy_cap
    FROM (
      -- Toutes les réservations legacy (annulées comprises), seats=0 si annulée
      SELECT r.session_id,
             COALESCE(SUM(CASE WHEN r.status <> 'cancelled' THEN r.participants ELSE 0 END),0) AS seats
        FROM reservations r
       WHERE r.session_id IS NOT NULL
         AND r.daily_group_id IS NULL
       GROUP BY r.session_id
      UNION ALL
      SELECT pb.session_id,
             COALESCE(SUM(CASE WHEN pb.status = 'confirmed' THEN 1 ELSE 0 END),0)
        FROM package_bookings pb
       WHERE pb.session_id IS NOT NULL
         AND pb.daily_group_id IS NULL
       GROUP BY pb.session_id
    ) load
    JOIN sessions s ON s.id = load.session_id
    GROUP BY s.date, s.activity
  LOOP
    SELECT id INTO v_group_id FROM daily_groups
     WHERE date = v_row.date AND activity = v_row.activity AND status = 'archived'
     ORDER BY group_index LIMIT 1;

    v_needed := COALESCE(v_row.total_seats,0);
    IF v_group_id IS NOT NULL THEN
      v_needed := v_needed
        + COALESCE((SELECT SUM(participants) FROM reservations
                     WHERE daily_group_id = v_group_id AND status <> 'cancelled'),0)
        + COALESCE((SELECT COUNT(*) FROM package_bookings
                     WHERE daily_group_id = v_group_id AND status = 'confirmed'),0);
    END IF;
    v_needed := GREATEST(v_needed, COALESCE(v_row.legacy_cap,0), 1);

    IF v_group_id IS NULL THEN
      SELECT COALESCE(MAX(group_index),0) + 1 INTO v_new_idx
        FROM daily_groups
       WHERE date = v_row.date AND activity = v_row.activity;

      INSERT INTO daily_groups (date, activity, group_index, max_participants, status, notes)
      VALUES (v_row.date, v_row.activity, v_new_idx, v_needed, 'archived',
              'Archive migration legacy sessions — étape 2 backfill')
      RETURNING id INTO v_group_id;

      v_archives_created := v_archives_created + 1;
    ELSE
      UPDATE daily_groups SET max_participants = GREATEST(max_participants, v_needed)
       WHERE id = v_group_id;
    END IF;
  END LOOP;

  -- 2. Rattacher les réservations legacy
  FOR v_row IN
    SELECT r.id, s.date, s.activity
      FROM reservations r
      JOIN sessions s ON s.id = r.session_id
     WHERE r.session_id IS NOT NULL AND r.daily_group_id IS NULL
  LOOP
    SELECT id INTO v_group_id FROM daily_groups
     WHERE date = v_row.date AND activity = v_row.activity AND status = 'archived'
     ORDER BY group_index LIMIT 1;
    IF v_group_id IS NULL THEN CONTINUE; END IF;
    UPDATE reservations SET daily_group_id = v_group_id WHERE id = v_row.id;
    v_res_migrated := v_res_migrated + 1;
  END LOOP;

  -- 3. Rattacher les package_bookings legacy
  FOR v_row IN
    SELECT pb.id, s.date, s.activity
      FROM package_bookings pb
      JOIN sessions s ON s.id = pb.session_id
     WHERE pb.session_id IS NOT NULL AND pb.daily_group_id IS NULL
  LOOP
    SELECT id INTO v_group_id FROM daily_groups
     WHERE date = v_row.date AND activity = v_row.activity AND status = 'archived'
     ORDER BY group_index LIMIT 1;
    IF v_group_id IS NULL THEN CONTINUE; END IF;
    UPDATE package_bookings SET daily_group_id = v_group_id WHERE id = v_row.id;
    v_pkg_migrated := v_pkg_migrated + 1;
  END LOOP;

  -- 4. Libérer la référence legacy `session_id` (toutes les lignes sont désormais sur daily_groups)
  WITH upd AS (
    UPDATE reservations SET session_id = NULL
     WHERE session_id IS NOT NULL AND daily_group_id IS NOT NULL
     RETURNING 1
  ) SELECT COUNT(*) INTO v_res_detached FROM upd;

  WITH upd AS (
    UPDATE package_bookings SET session_id = NULL
     WHERE session_id IS NOT NULL AND daily_group_id IS NOT NULL
     RETURNING 1
  ) SELECT COUNT(*) INTO v_pkg_detached FROM upd;

  -- 5. Vérification finale
  SELECT COUNT(*) INTO v_res_left FROM reservations WHERE session_id IS NOT NULL;
  SELECT COUNT(*) INTO v_pkg_left FROM package_bookings WHERE session_id IS NOT NULL;

  RAISE NOTICE '===== RAPPORT BACKFILL ÉTAPE 2 =====';
  RAISE NOTICE 'Groupes archive créés            : %', v_archives_created;
  RAISE NOTICE 'Réservations rattachées          : %', v_res_migrated;
  RAISE NOTICE 'Package bookings rattachés       : %', v_pkg_migrated;
  RAISE NOTICE 'Reservations.session_id libérés  : %', v_res_detached;
  RAISE NOTICE 'Package_bookings.session_id libérés : %', v_pkg_detached;
  RAISE NOTICE 'Reservations.session_id restant  : %', v_res_left;
  RAISE NOTICE 'Package_bookings.session_id restant : %', v_pkg_left;

  IF v_res_left <> 0 OR v_pkg_left <> 0 THEN
    RAISE EXCEPTION 'Backfill incomplet : reservations=% package_bookings=%', v_res_left, v_pkg_left;
  END IF;
END $$;