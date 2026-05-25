INSERT INTO storage.buckets (id, name, public) VALUES ('whatsapp-exports','whatsapp-exports',true) ON CONFLICT (id) DO UPDATE SET public=true;

CREATE POLICY "Public read whatsapp-exports" ON storage.objects FOR SELECT USING (bucket_id = 'whatsapp-exports');
CREATE POLICY "Authenticated upload whatsapp-exports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'whatsapp-exports');