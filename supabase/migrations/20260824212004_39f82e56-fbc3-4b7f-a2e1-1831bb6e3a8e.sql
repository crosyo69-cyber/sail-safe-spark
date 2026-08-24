-- ============================================================
-- LOT C-1 · MIGRATION A — Intégrité financière crédits
-- P0-1 : double recrédit admin
-- P0-2 : fallback dangereux de restore_credit_fifo
-- Aucun DELETE / UPDATE de données. Aucun changement de schéma.
-- ============================================================

-- ---------- 1. admin_recredit_package : ajout de p_booking_id ----------
-- L'ancienne signature à 4 arguments est supprimée pour éviter toute
-- surcharge ambiguë. p_booking_id est optionnel : les appelants existants
-- (credit.service.ts, AdminPackagesManager.tsx) restent valides.
DROP FUNCTION IF EXISTS public.admin_recredit_package(uuid, integer, text, boolean);

CREATE OR REPLACE FUNCTION public.admin_recredit_package(
  p_package_id uuid,
  p_sessions integer,
  p_reason text,
  p_notify boolean DEFAULT true,
  p_booking_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg public.client_packages;
  v_caller uuid := auth.uid();
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF COALESCE(p_sessions, 0) < 1 THEN RAISE EXCEPTION 'invalid_sessions'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  UPDATE public.client_packages
     SET total_sessions = total_sessions + p_sessions,
         status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
         updated_at = now()
   WHERE id = p_package_id
  RETURNING * INTO v_pkg;

  IF NOT FOUND THEN RAISE EXCEPTION 'package_not_found'; END IF;

  INSERT INTO public.package_credit_history
    (package_id, delta, kind, reason, performed_by, balance_after, booking_id)
  VALUES
    (p_package_id, p_sessions, 'admin_credit', trim(p_reason), v_caller,
     v_pkg.total_sessions - v_pkg.used_sessions, p_booking_id);

  PERFORM public.enqueue_admin_notification(
    'admin_credit', 'info',
    'Recrédit séance — ' || COALESCE(v_pkg.first_name,'') || ' ' || COALESCE(v_pkg.last_name,''),
    'Pack ' || v_pkg.package_code || ' · +' || p_sessions::text || ' séance(s) · Motif : ' || trim(p_reason),
    jsonb_build_object('package_id', p_package_id, 'package_code', v_pkg.package_code,
                       'sessions', p_sessions, 'reason', trim(p_reason),
                       'booking_id', p_booking_id, 'performed_by', v_caller)
  );

  IF p_notify THEN
    PERFORM public.enqueue_recredit_notification(p_package_id, p_sessions, p_reason);
  END IF;

  RETURN jsonb_build_object('ok', true,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions,
    'total', v_pkg.total_sessions);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_recredit_package(uuid, integer, text, boolean, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_recredit_package(uuid, integer, text, boolean, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recredit_package(uuid, integer, text, boolean, uuid) TO service_role;

-- ---------- 2. admin_cancel_and_recredit : garde d'idempotence ----------
CREATE OR REPLACE FUNCTION public.admin_cancel_and_recredit(p_kind text, p_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_pkg_id uuid;
  v_status text;
  v_pkg public.client_packages;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'reason_required'; END IF;

  IF p_kind = 'visitor' THEN
    UPDATE public.reservations SET status = 'cancelled' WHERE id = p_id;
    RETURN jsonb_build_object('ok', true, 'credited', 0);
  ELSIF p_kind <> 'package' THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;

  -- Verrou pessimiste : sérialise tous les appels concurrents sur ce booking
  SELECT package_id, status INTO v_pkg_id, v_status
    FROM public.package_bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;

  IF v_status = 'confirmed' THEN
    -- L'annulation restitue automatiquement 1 crédit (trigger sync_package_used_sessions)
    UPDATE public.package_bookings
       SET status = 'cancelled', updated_at = now()
     WHERE id = p_id;

    -- Traçabilité du motif école sur la dernière ligne d'historique générée
    UPDATE public.package_credit_history
       SET reason = 'Annulation école — ' || trim(p_reason),
           performed_by = v_caller
     WHERE id = (
       SELECT id FROM public.package_credit_history
        WHERE booking_id = p_id AND kind = 'cancellation'
        ORDER BY created_at DESC LIMIT 1
     );
  ELSE
    -- Déjà annulée : garde d'idempotence sur booking_id
    IF EXISTS (
      SELECT 1 FROM public.package_credit_history
       WHERE booking_id = p_id AND delta > 0
    ) THEN
      RETURN jsonb_build_object('ok', true, 'credited', 0, 'already_recredited', true);
    END IF;

    -- Aucun recrédit connu pour ce booking : on recrédite en le traçant
    PERFORM public.admin_recredit_package(
      v_pkg_id, 1, 'Annulation école — ' || trim(p_reason), false, p_id);
  END IF;

  SELECT * INTO v_pkg FROM public.client_packages WHERE id = v_pkg_id;

  -- Notifications uniquement lorsqu'un recrédit réel a eu lieu
  PERFORM public.enqueue_recredit_notification(v_pkg_id, 1, p_reason);

  PERFORM public.enqueue_admin_notification(
    'admin_credit', 'info',
    'Annulation + recrédit — ' || COALESCE(v_pkg.first_name,'') || ' ' || COALESCE(v_pkg.last_name,''),
    'Pack ' || v_pkg.package_code || ' · 1 séance recréditée · Motif : ' || trim(p_reason),
    jsonb_build_object('booking_id', p_id, 'package_id', v_pkg_id,
                       'reason', trim(p_reason), 'performed_by', v_caller)
  );

  RETURN jsonb_build_object('ok', true, 'credited', 1,
    'remaining', v_pkg.total_sessions - v_pkg.used_sessions);
END;
$function$;

-- ---------- 3. restore_credit_fifo : plus de vol, plus de mint ----------
CREATE OR REPLACE FUNCTION public.restore_credit_fifo(p_package_id uuid, p_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  -- 1) Crédit directement rattaché au booking annulé (cas nominal)
  SELECT id INTO v_id FROM public.session_credits
   WHERE package_id = p_package_id
     AND booking_id = p_booking_id
     AND status = 'consumed'
   ORDER BY consumed_at DESC
   LIMIT 1;

  -- 2) Fallback strictement borné : crédit consommé orphelin, ou rattaché
  --    à une réservation qui n'est PLUS confirmée. Jamais celui d'un booking actif.
  IF v_id IS NULL THEN
    SELECT sc.id INTO v_id
      FROM public.session_credits sc
      LEFT JOIN public.package_bookings pb ON pb.id = sc.booking_id
     WHERE sc.package_id = p_package_id
       AND sc.status = 'consumed'
       AND (sc.booking_id IS NULL OR pb.id IS NULL OR pb.status <> 'confirmed')
     ORDER BY sc.consumed_at DESC NULLS LAST
     LIMIT 1;
  END IF;

  -- 3) Aucun crédit restaurable : on NE crée RIEN, on journalise l'anomalie
  IF v_id IS NULL THEN
    PERFORM public.log_credit_action(
      NULL, p_package_id, 'restore_orphan',
      'Aucun crédit restaurable pour ce booking',
      jsonb_build_object('booking_id', p_booking_id));
    RETURN NULL;
  END IF;

  UPDATE public.session_credits
     SET status = CASE WHEN expires_at < now() THEN 'expired' ELSE 'available' END,
         consumed_at = NULL, booking_id = NULL, updated_at = now()
   WHERE id = v_id;

  PERFORM public.log_credit_action(v_id, p_package_id, 'restored', NULL,
    jsonb_build_object('booking_id', p_booking_id));
  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.restore_credit_fifo(uuid, uuid) FROM PUBLIC, anon, authenticated;