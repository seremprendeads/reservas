-- Storage bucket for shop product images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('shop-images', 'shop-images', true, 2097152, 
  ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read shop-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-images');

-- Admin insert
CREATE POLICY "Admin insert shop-images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-images'
  AND EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);

-- Admin delete
CREATE POLICY "Admin delete shop-images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-images'
  AND EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);
