-- Rollback ciblé F-12-02 : la policy SELECT publique de blog_comments appelle has_role,
-- le revoke anon provoquait une erreur 42501 pour les visiteurs. Restauration à l'identique.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;