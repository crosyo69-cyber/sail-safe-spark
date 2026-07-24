-- Étape A.1 : verrouiller la RPC legacy book_session_with_code.
-- Aucune suppression : on retire uniquement le droit d'exécution public.
-- service_role garde l'accès (tests, éventuelle intervention admin).
REVOKE EXECUTE ON FUNCTION public.book_session_with_code(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.book_session_with_code(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.book_session_with_code(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.book_session_with_code(text, uuid) TO service_role;