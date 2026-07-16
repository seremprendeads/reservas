-- ============================================================
-- FIX: landing_pages RLS + branding storage bucket
-- ============================================================

-- 1. Fix landing_pages RLS policies
-- The old policy used auth.jwt() which only works with Supabase Auth.
-- The admin panel uses a custom JWT via Edge Functions, not Supabase Auth,
-- so auth.jwt() returns null -> 401 errors.
-- Fix: allow anon read for published pages, anon full access for admin CRUD.

DROP POLICY IF EXISTS "Owner can manage own landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can read published landing pages" ON landing_pages;

-- Public can read published landing pages
CREATE POLICY "Public can read published landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'published');

-- Anon can read all landing pages (admin needs to list/draft their own)
CREATE POLICY "Anon can read landing pages"
  ON landing_pages FOR SELECT
  USING (true);

-- Anon can insert landing pages (admin creates new ones)
CREATE POLICY "Anon can insert landing pages"
  ON landing_pages FOR INSERT
  WITH CHECK (true);

-- Anon can update landing pages (admin saves edits)
CREATE POLICY "Anon can update landing pages"
  ON landing_pages FOR UPDATE
  USING (true);

-- Anon can delete landing pages (admin removes them)
CREATE POLICY "Anon can delete landing pages"
  ON landing_pages FOR DELETE
  USING (true);

-- Service role manages everything
CREATE POLICY "Service role manages landing_pages"
  ON landing_pages FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 2. Create branding storage bucket (for landing page images)
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

-- Anon insert for branding bucket
DROP POLICY IF EXISTS "Admin insert branding" ON storage.objects;
CREATE POLICY "Anon insert branding" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'branding');

-- Anon delete for branding bucket
DROP POLICY IF EXISTS "Admin delete branding" ON storage.objects;
CREATE POLICY "Anon delete branding" ON storage.objects FOR DELETE
  USING (bucket_id = 'branding');
