-- 1) Split blog_comments SELECT policy so anon never evaluates has_role()
DROP POLICY "Approved comments are viewable by everyone" ON public.blog_comments;

CREATE POLICY "Approved comments are public"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (is_approved = true);

CREATE POLICY "Owners and admins read all comments"
ON public.blog_comments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Remove anon EXECUTE on has_role (no PUBLIC grant exists)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;