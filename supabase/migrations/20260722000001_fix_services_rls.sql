-- Fix services RLS: allow anon (frontend) to manage services
-- The admin panel uses the anon key (no Supabase Auth session),
-- so direct writes need anon-level policies.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read services" ON services;
DROP POLICY IF EXISTS "Service role manages services" ON services;

-- Allow anyone to read services (public booking page needs this)
CREATE POLICY "Public read services" ON services FOR SELECT
  USING (true);

-- Allow anon to manage services (admin panel uses anon key)
CREATE POLICY "Anon manage services" ON services FOR ALL
  USING (true) WITH CHECK (true);
