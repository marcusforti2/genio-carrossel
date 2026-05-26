
-- 1. Prevent privilege escalation: only admins can insert/update/delete user_roles
CREATE POLICY "Admins manage roles - insert"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles - update"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles - delete"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Make whatsapp-exports private
UPDATE storage.buckets SET public = false WHERE id = 'whatsapp-exports';

-- 3. Replace storage policies on whatsapp-exports with ownership checks
DROP POLICY IF EXISTS "Public read whatsapp-exports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload whatsapp-exports" ON storage.objects;

CREATE POLICY "Users upload to own whatsapp-exports folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-exports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own whatsapp-exports"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'whatsapp-exports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own whatsapp-exports"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'whatsapp-exports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own whatsapp-exports"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'whatsapp-exports'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
