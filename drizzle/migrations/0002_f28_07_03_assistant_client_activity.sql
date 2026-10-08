-- F-28-07-03: assistant reservation metrics classify visitor reservations by reservations.client_activity.
-- Group/occupation intents (reservations_detail, journees_completes, remplissage) keep daily_groups.activity.
-- Targeted, asserted text replacements on the current definitions (no other change; ACL/SECURITY DEFINER/search_path preserved by CREATE OR REPLACE).
DO $mig$
DECLARE
  d text; n text;
  PROCEDURE_ok boolean;
BEGIN
  -- assistant_financial_summary
  SELECT pg_get_functiondef('public.assistant_financial_summary()'::regprocedure) INTO d;
  n := replace(d, $s$'reservation', coalesce(g.activity::text, 'inconnue')$s$, $s$'reservation', r.client_activity::text$s$);
  IF (length(d) - length(replace(d, $s$'reservation', coalesce(g.activity::text, 'inconnue')$s$, ''))) / length($s$'reservation', coalesce(g.activity::text, 'inconnue')$s$) <> 2 THEN
    RAISE EXCEPTION 'F28_07_03 financial: expected 2 activite occurrences'; END IF;
  IF position($s$public.unit_price_eur(coalesce(g.activity::text,'kitesurf'), 'collectif'$s$ in n) = 0 THEN
    RAISE EXCEPTION 'F28_07_03 financial: unit_price occurrence missing'; END IF;
  n := replace(n, $s$public.unit_price_eur(coalesce(g.activity::text,'kitesurf'), 'collectif'$s$, $s$public.unit_price_eur(r.client_activity::text, 'collectif'$s$);
  EXECUTE n;

  -- assistant_query
  SELECT pg_get_functiondef('public.assistant_query(text, jsonb)'::regprocedure) INTO d;
  n := d;
  IF position($s$SELECT g2.activity::text AS a, count(*) AS n$s$ in n) = 0
     OR position($s$AND (v_activity IS NULL OR g2.activity::text = v_activity)
          GROUP BY g2.activity$s$ in n) = 0
     OR position($s$WHERE r.status = 'confirmed'
      AND g.date BETWEEN v_start AND v_end
      AND (v_activity IS NULL OR g.activity::text = v_activity);$s$ in n) = 0
     OR position($s$SELECT r.participants, g.activity::text AS activity$s$ in n) = 0
     OR position($s$'activite', g.activity::text,
        'participants', coalesce(sum(r.participants), 0),$s$ in n) = 0
     OR position($s$GROUP BY g.activity
    ) s;$s$ in n) = 0 THEN
    RAISE EXCEPTION 'F28_07_03 query: expected fragment missing';
  END IF;
  -- intent 'reservations' (counts of reservations) -> client activity
  n := replace(n, $s$SELECT g2.activity::text AS a, count(*) AS n$s$, $s$SELECT r2.client_activity::text AS a, count(*) AS n$s$);
  n := replace(n, $s$AND (v_activity IS NULL OR g2.activity::text = v_activity)
          GROUP BY g2.activity$s$, $s$AND (v_activity IS NULL OR r2.client_activity::text = v_activity)
          GROUP BY r2.client_activity$s$);
  n := replace(n, $s$WHERE r.status = 'confirmed'
      AND g.date BETWEEN v_start AND v_end
      AND (v_activity IS NULL OR g.activity::text = v_activity);$s$, $s$WHERE r.status = 'confirmed'
      AND g.date BETWEEN v_start AND v_end
      AND (v_activity IS NULL OR r.client_activity::text = v_activity);$s$);
  -- intent 'business' (deposit revenue per activity) -> client activity
  n := replace(n, $s$SELECT r.participants, g.activity::text AS activity$s$, $s$SELECT r.participants, r.client_activity::text AS activity$s$);
  -- intent 'meilleure_activite' (reservations/revenue per activity) -> client activity; groups without reservations keep their group activity with 0
  n := replace(n, $s$'activite', g.activity::text,
        'participants', coalesce(sum(r.participants), 0),$s$, $s$'activite', coalesce(r.client_activity, g.activity)::text,
        'participants', coalesce(sum(r.participants), 0),$s$);
  n := replace(n, $s$GROUP BY g.activity
    ) s;$s$, $s$GROUP BY coalesce(r.client_activity, g.activity)
    ) s;$s$);
  EXECUTE n;
END
$mig$;