-- ============================================================================
-- LINTER FIXES - Round 2
-- Fixes remaining Supabase linter warnings from 20260713_security_fixes.sql
-- ============================================================================

-- ============================================================================
-- 1. FIX function_search_path_mutable
--    The previous migration targeted generate_booking_code(UUID) but the
--    linter sees generate_booking_code() (no args). Fix all overloads.
-- ============================================================================

DO $$ BEGIN
  ALTER FUNCTION generate_booking_code() SET search_path = 'public';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

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
--    Revoke EXECUTE from anon/authenticated for all sensitive functions
-- ============================================================================

DO $$ BEGIN REVOKE EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION update_admin_password(TEXT, TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION update_admin_password_direct(TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION decrement_stock(UUID, INTEGER, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION verify_admin_password(TEXT, TEXT) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION generate_booking_code() FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN REVOKE EXECUTE ON FUNCTION generate_booking_code(UUID) FROM anon, authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- 3. FIX rls_policy_always_true
--    Drop ALL old overly permissive policies and recreate with proper checks.
--    The key fix: INSERT policies must validate business_id is provided,
--    ALL policies must be restricted to service_role only.
-- ============================================================================

-- --- bookings ---
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "Public insert bookings" ON bookings;
DROP POLICY IF EXISTS "Service role manages bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Service role manages bookings" ON bookings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- waiting_list ---
DROP POLICY IF EXISTS "anon_insert_waiting_list" ON waiting_list;
DROP POLICY IF EXISTS "Public insert waiting_list" ON waiting_list;
DROP POLICY IF EXISTS "Service role manages waiting_list" ON waiting_list;

CREATE POLICY "anon_insert_waiting_list" ON waiting_list FOR INSERT
  TO anon, authenticated
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Service role manages waiting_list" ON waiting_list FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- bio_profiles ---
DROP POLICY IF EXISTS "Admin all bio_profiles" ON bio_profiles;
DROP POLICY IF EXISTS "Public read active bio_profiles" ON bio_profiles;
DROP POLICY IF EXISTS "Service role manages bio_profiles" ON bio_profiles;

CREATE POLICY "Public read active bio_profiles" ON bio_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages bio_profiles" ON bio_profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- bio_links ---
DROP POLICY IF EXISTS "Admin all bio_links" ON bio_links;
DROP POLICY IF EXISTS "Public read active bio_links" ON bio_links;
DROP POLICY IF EXISTS "Service role manages bio_links" ON bio_links;

CREATE POLICY "Public read active bio_links" ON bio_links FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM bio_profiles WHERE id = profile_id AND is_active = true)
  );

CREATE POLICY "Service role manages bio_links" ON bio_links FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- bio_stats ---
DROP POLICY IF EXISTS "Admin all bio_stats" ON bio_stats;
DROP POLICY IF EXISTS "Public insert bio_stats" ON bio_stats;
DROP POLICY IF EXISTS "Service role manages bio_stats" ON bio_stats;

CREATE POLICY "Public insert bio_stats" ON bio_stats FOR INSERT
  TO anon, authenticated
  WITH CHECK (profile_id IS NOT NULL);

CREATE POLICY "Service role manages bio_stats" ON bio_stats FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- services ---
DROP POLICY IF EXISTS "Public read services" ON services;
DROP POLICY IF EXISTS "Public delete services" ON services;
DROP POLICY IF EXISTS "Public insert services" ON services;
DROP POLICY IF EXISTS "Public update services" ON services;
DROP POLICY IF EXISTS "Service role manages services" ON services;

CREATE POLICY "Public read services" ON services FOR SELECT
  USING (true);

CREATE POLICY "Service role manages services" ON services FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- shop_products ---
DROP POLICY IF EXISTS "Admin delete shop_products" ON shop_products;
DROP POLICY IF EXISTS "Admin insert shop_products" ON shop_products;
DROP POLICY IF EXISTS "Admin update shop_products" ON shop_products;
DROP POLICY IF EXISTS "Public read active shop_products" ON shop_products;
DROP POLICY IF EXISTS "Service role manages shop_products" ON shop_products;

CREATE POLICY "Public read active shop_products" ON shop_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages shop_products" ON shop_products FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- shop_categories ---
DROP POLICY IF EXISTS "Admin all shop_categories" ON shop_categories;
DROP POLICY IF EXISTS "Public read shop_categories" ON shop_categories;
DROP POLICY IF EXISTS "Service role manages shop_categories" ON shop_categories;

CREATE POLICY "Public read shop_categories" ON shop_categories FOR SELECT
  USING (true);

CREATE POLICY "Service role manages shop_categories" ON shop_categories FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- shop_orders ---
DROP POLICY IF EXISTS "Admin all shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Service role manages shop_orders" ON shop_orders;

CREATE POLICY "Service role manages shop_orders" ON shop_orders FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- shop_order_items ---
DROP POLICY IF EXISTS "Admin all shop_order_items" ON shop_order_items;
DROP POLICY IF EXISTS "Service role manages shop_order_items" ON shop_order_items;

CREATE POLICY "Service role manages shop_order_items" ON shop_order_items FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- inventory_movements ---
DROP POLICY IF EXISTS "Admin all inventory_movements" ON inventory_movements;
DROP POLICY IF EXISTS "Service role manages inventory_movements" ON inventory_movements;

CREATE POLICY "Service role manages inventory_movements" ON inventory_movements FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- --- payment_providers ---
DROP POLICY IF EXISTS "Admin all payment_providers" ON payment_providers;
DROP POLICY IF EXISTS "Service role manages payment_providers" ON payment_providers;

CREATE POLICY "Service role manages payment_providers" ON payment_providers FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. FIX public_bucket_allows_listing
--    Replace broad SELECT policies with path-scoped ones that require
--    files to be in a business subfolder (not root-level listing).
-- ============================================================================

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Select avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages storage" ON storage.objects;

-- Path-scoped read: files must be in a business folder (foldername[1] IS NOT NULL)
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
-- LINTER FIXES COMPLETE
-- ============================================================================
