-- Bio Module: link-in-bio pages

CREATE TABLE IF NOT EXISTS bio_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  city TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_facebook TEXT,
  social_youtube TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  primary_color TEXT NOT NULL DEFAULT '#059669',
  bg_type TEXT NOT NULL DEFAULT 'solid' CHECK (bg_type IN ('solid', 'gradient', 'image')),
  bg_solid_color TEXT NOT NULL DEFAULT '#ffffff',
  bg_gradient_from TEXT NOT NULL DEFAULT '#f0fdf4',
  bg_gradient_to TEXT NOT NULL DEFAULT '#dcfce7',
  bg_image_url TEXT,
  button_style TEXT NOT NULL DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'pill', 'square')),
  button_shadow BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bio_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bio_profiles" ON bio_profiles;
CREATE POLICY "Public read bio_profiles" ON bio_profiles FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin all bio_profiles" ON bio_profiles;
CREATE POLICY "Admin all bio_profiles" ON bio_profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);

CREATE TABLE IF NOT EXISTS bio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES bio_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bio_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read bio_links" ON bio_links;
CREATE POLICY "Public read bio_links" ON bio_links FOR SELECT USING (
  is_active = true AND EXISTS (SELECT 1 FROM bio_profiles WHERE id = profile_id AND is_active = true)
);
DROP POLICY IF EXISTS "Admin all bio_links" ON bio_links;
CREATE POLICY "Admin all bio_links" ON bio_links FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);

CREATE TABLE IF NOT EXISTS bio_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES bio_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'click')),
  link_id UUID REFERENCES bio_links(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bio_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert bio_stats" ON bio_stats;
CREATE POLICY "Public insert bio_stats" ON bio_stats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin read bio_stats" ON bio_stats;
CREATE POLICY "Admin read bio_stats" ON bio_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);

CREATE INDEX IF NOT EXISTS idx_bio_links_profile ON bio_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_bio_stats_profile ON bio_stats(profile_id);
CREATE INDEX IF NOT EXISTS idx_bio_stats_created ON bio_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_bio_stats_event ON bio_stats(event_type);
