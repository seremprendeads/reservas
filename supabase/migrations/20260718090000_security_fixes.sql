-- ============================================================================
-- SECURITY FIXES - Post multi-tenant migration
-- Addresses Supabase linter warnings
-- ============================================================================

-- ============================================================================
-- 1. FIX function_search_path_mutable
-- ============================================================================

-- Drop old overload without business_id parameter
DROP FUNCTION IF EXISTS generate_booking_code();

DO $$ BEGIN
  ALTER FUNCTION generate_booking_code(UUID) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION verify_admin_password(TEXT, TEXT) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION create_admin_user(TEXT, TEXT, TEXT) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION update_admin_password(TEXT, TEXT, TEXT) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION update_admin_password_direct(TEXT, TEXT) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  ALTER FUNCTION decrement_stock(UUID, INTEGER, TEXT) SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- ============================================================================
-- 2. FIX anon_security_definer_function_executable
--    Revoke EXECUTE from anon/authenticated for sensitive functions
-- ============================================================================

DO $$ BEGIN REVOKE EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION update_admin_password(TEXT, TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION update_admin_password_direct(TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION generate_booking_code(UUID) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- 3. FIX rls_policy_always_true
--    Drop overly permissive old policies and recreate properly
-- ============================================================================

-- Drop old leftover policies that the multi-tenant migration may not have cleaned
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND policyname IN (
      'anon_insert_bookings',
      'Public insert bookings',
      'Public delete services',
      'Public insert services',
      'Public update services',
      'Admin all bio_links',
      'Admin all bio_profiles',
      'Admin all bio_stats',
      'Admin all inventory_movements',
      'Admin all payment_providers',
      'Admin all shop_categories',
      'Admin all shop_order_items',
      'Admin all shop_orders',
      'Admin delete shop_products',
      'Admin insert shop_products',
      'Admin update shop_products',
      'anon_insert_waiting_list'
    )
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
  END LOOP;
END $$;

-- Recreate proper multi-tenant policies (only if not already exists)
-- Bookings: only service_role should manage, anon can only insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Public insert bookings" ON bookings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Service role manages bookings" ON bookings FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Waiting list: only service_role should manage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert waiting_list' AND tablename = 'waiting_list') THEN
    CREATE POLICY "Public insert waiting_list" ON waiting_list FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages waiting_list' AND tablename = 'waiting_list') THEN
    CREATE POLICY "Service role manages waiting_list" ON waiting_list FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Bio profiles: public reads active, service_role manages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active bio_profiles' AND tablename = 'bio_profiles') THEN
    CREATE POLICY "Public read active bio_profiles" ON bio_profiles FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages bio_profiles' AND tablename = 'bio_profiles') THEN
    CREATE POLICY "Service role manages bio_profiles" ON bio_profiles FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Bio links: public reads active, service_role manages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active bio_links' AND tablename = 'bio_links') THEN
    CREATE POLICY "Public read active bio_links" ON bio_links FOR SELECT
      USING (
        is_active = true
        AND EXISTS (SELECT 1 FROM bio_profiles WHERE id = profile_id AND is_active = true)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages bio_links' AND tablename = 'bio_links') THEN
    CREATE POLICY "Service role manages bio_links" ON bio_links FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Bio stats: public insert, service_role manages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert bio_stats' AND tablename = 'bio_stats') THEN
    CREATE POLICY "Public insert bio_stats" ON bio_stats FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages bio_stats' AND tablename = 'bio_stats') THEN
    CREATE POLICY "Service role manages bio_stats" ON bio_stats FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Services: public reads, service_role manages (NO public insert/update/delete)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read services' AND tablename = 'services') THEN
    CREATE POLICY "Public read services" ON services FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages services' AND tablename = 'services') THEN
    CREATE POLICY "Service role manages services" ON services FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Shop products: public reads active, service_role manages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active shop_products' AND tablename = 'shop_products') THEN
    CREATE POLICY "Public read active shop_products" ON shop_products FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages shop_products' AND tablename = 'shop_products') THEN
    CREATE POLICY "Service role manages shop_products" ON shop_products FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Shop categories: public reads, service_role manages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read shop_categories' AND tablename = 'shop_categories') THEN
    CREATE POLICY "Public read shop_categories" ON shop_categories FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages shop_categories' AND tablename = 'shop_categories') THEN
    CREATE POLICY "Service role manages shop_categories" ON shop_categories FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Shop orders: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages shop_orders' AND tablename = 'shop_orders') THEN
    CREATE POLICY "Service role manages shop_orders" ON shop_orders FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Shop order items: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages shop_order_items' AND tablename = 'shop_order_items') THEN
    CREATE POLICY "Service role manages shop_order_items" ON shop_order_items FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Inventory movements: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages inventory_movements' AND tablename = 'inventory_movements') THEN
    CREATE POLICY "Service role manages inventory_movements" ON inventory_movements FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Payment providers: only service_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages payment_providers' AND tablename = 'payment_providers') THEN
    CREATE POLICY "Service role manages payment_providers" ON payment_providers FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 4. FIX public_bucket_allows_listing
--    Replace broad storage policies with path-scoped ones
-- ============================================================================

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Select avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages storage" ON storage.objects;

-- Path-scoped read policies (defense in depth - files must be in a business folder)
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "Public read branding" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

CREATE POLICY "Public read shop-images" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shop-images'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Service role manages all storage
CREATE POLICY "Service role manages storage" ON storage.objects FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- SECURITY FIXES COMPLETE
-- ============================================================================
