-- 1. Defense in depth: anon (visiteurs non connectés) ne garde de SELECT
--    que sur les tables réellement publiques.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
       AND c.relname NOT IN ('daily_groups', 'blog_comments')
  LOOP
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t.relname);
  END LOOP;
END $$;

-- 2. Les nouvelles tables du schéma public ne seront plus accessibles
--    automatiquement : chaque GRANT devra être explicite (évite toute fuite
--    via un futur champ ou une future table).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

-- 3. Les nouvelles fonctions ne seront plus exécutables par anon sans GRANT
--    explicite (évite un futur RPC SECURITY DEFINER exposé par défaut).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 4. service_role conserve l'accès complet (edge functions / jobs).
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.relname);
  END LOOP;
END $$;

-- 5. Journées : accès public strictement limité aux colonnes non sensibles.
REVOKE SELECT ON public.daily_groups FROM anon, authenticated, PUBLIC;
GRANT SELECT (id, date, activity, group_index, max_participants, status, created_at, updated_at)
  ON public.daily_groups TO anon, authenticated;