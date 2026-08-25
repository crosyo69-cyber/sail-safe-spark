-- ============================================================
-- ROLLBACK — LOT C-2.2-D-FIX
-- Date de création : 2026-08-25
-- NON APPLIQUÉ. À exécuter manuellement uniquement en cas de besoin.
-- ============================================================
--
-- PÉRIMÈTRE
-- Le lot C-2.2-D-FIX n'a modifié qu'un seul objet en base :
--   * public.move_to_dlq(text, text, bigint, jsonb)
--     -> caviardage des payloads d'e-mails OTP avant écriture en DLQ.
--
-- Aucun index, aucune policy, aucun GRANT, aucune table, aucune RPC métier
-- n'a été créé, modifié ou supprimé par ce lot.
-- Ce rollback NE recrée PAS les anciennes RPC `*_with_code` supprimées par
-- C-2.2-D : elles sont hors périmètre et leur restauration réintroduirait
-- la faille d'énumération corrigée précédemment.
--
-- CONSÉQUENCE DE CE ROLLBACK
-- Les e-mails OTP en échec repartiraient en DLQ avec leur payload complet
-- (html/text contenant le code de sécurité en clair) pendant 7 jours.
--
-- ============================================================
-- ÉTAPE 1 — Restauration de la définition antérieure de move_to_dlq
-- ============================================================

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$function$;

-- ============================================================
-- ÉTAPE 2 — Vérification post-rollback (lecture seule)
-- ============================================================
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'move_to_dlq';
-- Attendu : plus aucune référence à 'dlq_redacted'.

-- ============================================================
-- FIN DU ROLLBACK C-2.2-D-FIX
-- ============================================================
