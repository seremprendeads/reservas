-- Create branding storage bucket (for landing page images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- Public read for branding bucket
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Admin insert for branding bucket
DROP POLICY IF EXISTS "Admin insert branding" ON storage.objects;
CREATE POLICY "Admin insert branding" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Admin delete for branding bucket
DROP POLICY IF EXISTS "Admin delete branding" ON storage.objects;
CREATE POLICY "Admin delete branding" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'branding'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );
