-- ============================================================
-- MIGRATION: Landing Pages v2 - Remove AI, Add Template System
-- Fecha: 2026-07-21
-- ============================================================

-- Drop AI-related tables and functions
DROP TRIGGER IF EXISTS on_business_created_ai_credits ON businesses;
DROP FUNCTION IF EXISTS create_default_ai_credits();
DROP FUNCTION IF EXISTS consume_ai_credits(UUID, INT, TEXT, JSONB);
DROP TABLE IF EXISTS ai_usage_history;
DROP TABLE IF EXISTS ai_credits;

-- Update landing_pages table structure
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'minimal';
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS visible_sections JSONB NOT NULL DEFAULT '["header","hero","about","main_service","secondary_services","why_choose_us","gallery","testimonials","faq","cta","footer"]'::jsonb;

-- Update RLS policies - recreate for cleaner setup
DROP POLICY IF EXISTS "Owner can manage own landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can read published landing pages" ON landing_pages;

CREATE POLICY "Owner can manage own landing pages"
  ON landing_pages FOR ALL
  USING (business_id = (SELECT business_id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Public can read published landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'published');

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_landing_pages_business ON landing_pages(business_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
