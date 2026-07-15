-- Fix: allow public SELECT on businesses so BusinessContext works before login
-- The BusinessProvider wraps the entire app including the login page

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their businesses" ON businesses;
END $$;

-- Anyone can read basic business info (name, slug, etc.)
CREATE POLICY "Public read businesses" ON businesses FOR SELECT
  USING (is_active = true);

-- Service role manages everything
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role manages businesses" ON businesses;
END $$;
CREATE POLICY "Service role manages businesses" ON businesses FOR ALL
  TO service_role USING (true) WITH CHECK (true);
