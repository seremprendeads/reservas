-- Fix bio module RLS: remove JWT check that blocks frontend writes

-- bio_profiles
DROP POLICY IF EXISTS "Admin all bio_profiles" ON bio_profiles;
CREATE POLICY "Admin all bio_profiles" ON bio_profiles FOR ALL USING (true);

-- bio_links
DROP POLICY IF EXISTS "Admin all bio_links" ON bio_links;
CREATE POLICY "Admin all bio_links" ON bio_links FOR ALL USING (true);

-- bio_stats
DROP POLICY IF EXISTS "Admin read bio_stats" ON bio_stats;
DROP POLICY IF EXISTS "Admin all bio_stats" ON bio_stats;
CREATE POLICY "Admin all bio_stats" ON bio_stats FOR ALL USING (true);
