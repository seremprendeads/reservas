-- ============================================================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- Converts single-business app to multi-tenant SaaS platform
-- ============================================================================

-- ============================================================================
-- 1. BUSINESSES TABLE (Core Tenant Entity)
-- ============================================================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  logo_url TEXT,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  currency TEXT NOT NULL DEFAULT 'ARS',
  language TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_email);

-- ============================================================================
-- 2. BUSINESS MEMBERS (User-Business Relationship with Roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_email)
);

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_email ON business_members(user_email);

-- ============================================================================
-- 3. FEATURE FLAGS (Per-Business Feature Toggles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, feature_key)
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_feature_flags_business ON feature_flags(business_id);

-- Default feature flags for all businesses
INSERT INTO feature_flags (business_id, feature_key, is_enabled)
SELECT b.id, f.feature_key, f.is_enabled
FROM businesses b
CROSS JOIN (VALUES
  ('booking', true),
  ('shop', true),
  ('bio', true),
  ('payments', true),
  ('whatsapp', true),
  ('landing', false),
  ('landing_ia', false),
  ('chat_ia', false),
  ('analytics', false),
  ('google_reviews', false),
  ('multi_staff', false),
  ('branches', false),
  ('events', false),
  ('crm', false),
  ('automations', false),
  ('api', false),
  ('custom_domain', false),
  ('email_notifications', false)
) AS f(feature_key, is_enabled)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. AI CREDITS (Per-Business AI Usage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  credits_remaining INT NOT NULL DEFAULT 0,
  credits_used INT NOT NULL DEFAULT 0,
  provider TEXT CHECK (provider IN ('platform', 'openai', 'claude', 'gemini')),
  api_key_encrypted TEXT,
  monthly_limit INT NOT NULL DEFAULT 0,
  reset_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_credits_business ON ai_credits(business_id);

-- ============================================================================
-- 5. ADD BUSINESS_ID TO ALL EXISTING TABLES
-- ============================================================================

-- Create default business for existing data
INSERT INTO businesses (id, name, slug, owner_email, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mi Negocio',
  'mi-negocio',
  (SELECT email FROM admin_users LIMIT 1),
  'pro'
) ON CONFLICT (id) DO NOTHING;

-- Add business_id to availability_settings
ALTER TABLE availability_settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE availability_settings SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE availability_settings ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE availability_settings DROP CONSTRAINT IF EXISTS availability_settings_day_of_week_key;
DO $$ BEGIN
  ALTER TABLE availability_settings ADD CONSTRAINT availability_settings_business_day UNIQUE(business_id, day_of_week);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Add business_id to blocked_dates
ALTER TABLE blocked_dates ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE blocked_dates SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE blocked_dates ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE bookings SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE bookings ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to booking_counter
ALTER TABLE booking_counter ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE booking_counter SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE booking_counter ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE booking_counter DROP CONSTRAINT IF EXISTS booking_counter_pkey;
ALTER TABLE booking_counter ADD PRIMARY KEY (business_id, year);

-- Add business_id to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE settings SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE settings ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to branding (remove fixed UUID pattern)
ALTER TABLE branding ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE branding SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE branding ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE branding DROP CONSTRAINT IF EXISTS branding_pkey;
ALTER TABLE branding ADD PRIMARY KEY (business_id);

-- Add business_id to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE services SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE services ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to bio_profiles (replace admin_email unique with business_id)
ALTER TABLE bio_profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE bio_profiles SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE bio_profiles ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE bio_profiles DROP CONSTRAINT IF EXISTS bio_profiles_admin_email_key;
ALTER TABLE bio_profiles DROP CONSTRAINT IF EXISTS bio_profiles_slug_key;
DO $$ BEGIN
  ALTER TABLE bio_profiles ADD CONSTRAINT bio_profiles_business_slug UNIQUE(business_id, slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE bio_profiles ADD CONSTRAINT bio_profiles_slug_global UNIQUE(slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- bio_links inherits from bio_profiles
-- bio_stats inherits from bio_profiles

-- Add business_id to shop_categories
ALTER TABLE shop_categories ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE shop_categories SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE shop_categories ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to shop_products
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE shop_products SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE shop_products ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to shop_orders
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE shop_orders SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE shop_orders ALTER COLUMN business_id SET NOT NULL;

-- shop_order_items inherits from shop_orders

-- Add business_id to inventory_movements
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE inventory_movements SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE inventory_movements ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to payment_providers (replace shop_id)
ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE payment_providers SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
ALTER TABLE payment_providers ALTER COLUMN business_id SET NOT NULL;

-- Add business_id to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
UPDATE admin_users SET business_id = '00000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;

-- ============================================================================
-- 6. CREATE WAITING_LIST TABLE (if not exists) WITH business_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  fecha_deseada DATE NOT NULL,
  horario_deseado TIME,
  servicio TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'convertido', 'cancelado')),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_waiting_list_business ON waiting_list(business_id);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Get business_id from admin email
CREATE OR REPLACE FUNCTION get_business_id_from_admin(admin_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT business_id FROM admin_users WHERE email = admin_email LIMIT 1;
$$;

-- Get business_id from slug
CREATE OR REPLACE FUNCTION get_business_id_from_slug(business_slug TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM businesses WHERE slug = business_slug AND is_active = true LIMIT 1;
$$;

-- Check if user has role in business
CREATE OR REPLACE FUNCTION has_business_role(p_business_id UUID, p_email TEXT, p_min_role TEXT DEFAULT 'member')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = p_business_id
    AND user_email = p_email
    AND is_active = true
    AND role IN (
      CASE WHEN p_min_role = 'viewer' THEN 'viewer'
           WHEN p_min_role = 'member' THEN 'member'
           WHEN p_min_role = 'admin' THEN 'admin'
           WHEN p_min_role = 'owner' THEN 'owner'
      END,
      'owner'
    )
  );
$$;

-- ============================================================================
-- 8. UPDATE BOOKING CODE GENERATION (per-business)
-- ============================================================================

DROP FUNCTION IF EXISTS generate_booking_code();
CREATE OR REPLACE FUNCTION generate_booking_code(p_business_id UUID)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM CURRENT_DATE);
  new_number int;
  booking_code text;
BEGIN
  INSERT INTO booking_counter (business_id, year, last_number)
  VALUES (p_business_id, current_year, 1)
  ON CONFLICT (business_id, year) DO UPDATE
  SET last_number = booking_counter.last_number + 1
  RETURNING last_number INTO new_number;
  
  booking_code := 'RES-' || current_year || '-' || LPAD(new_number::text, 4, '0');
  RETURN booking_code;
END;
$$;

-- ============================================================================
-- 9. UPDATED RLS POLICIES (Multi-Tenant)
-- ============================================================================

-- Drop ALL existing policies
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
  END LOOP;
END $$;

-- BUSINESSES policies
CREATE POLICY "Users can view their businesses" ON businesses FOR SELECT
  USING (
    id IN (SELECT business_id FROM business_members WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' AND is_active = true)
    OR owner_email = current_setting('request.jwt.claims', true)::json->>'email'
  );

CREATE POLICY "Service role manages businesses" ON businesses FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BUSINESS_MEMBERS policies
CREATE POLICY "Members can view their memberships" ON business_members FOR SELECT
  USING (
    user_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR business_id IN (SELECT business_id FROM business_members WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email' AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Service role manages members" ON business_members FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- FEATURE_FLAGS policies
CREATE POLICY "Service role manages feature_flags" ON feature_flags FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- AI_CREDITS policies
CREATE POLICY "Service role manages ai_credits" ON ai_credits FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- AVAILABILITY_SETTINGS policies
CREATE POLICY "Public read availability by business" ON availability_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role manages availability" ON availability_settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BLOCKED_DATES policies
CREATE POLICY "Public read blocked_dates by business" ON blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Service role manages blocked_dates" ON blocked_dates FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BOOKINGS policies
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read own bookings" ON bookings FOR SELECT
  USING (true);

CREATE POLICY "Service role manages bookings" ON bookings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BOOKING_COUNTER policies
CREATE POLICY "Service role manages booking_counter" ON booking_counter FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SETTINGS policies
CREATE POLICY "Public read settings" ON settings FOR SELECT
  USING (true);

CREATE POLICY "Service role manages settings" ON settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BRANDING policies
CREATE POLICY "Public read branding" ON branding FOR SELECT
  USING (true);

CREATE POLICY "Service role manages branding" ON branding FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SERVICES policies
CREATE POLICY "Public read services" ON services FOR SELECT
  USING (true);

CREATE POLICY "Service role manages services" ON services FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ADMIN_USERS policies
CREATE POLICY "Service role manages admin_users" ON admin_users FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BIO_PROFILES policies
CREATE POLICY "Public read active bio_profiles" ON bio_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages bio_profiles" ON bio_profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BIO_LINKS policies
CREATE POLICY "Public read active bio_links" ON bio_links FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM bio_profiles WHERE id = profile_id AND is_active = true)
  );

CREATE POLICY "Service role manages bio_links" ON bio_links FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- BIO_STATS policies
CREATE POLICY "Public insert bio_stats" ON bio_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role manages bio_stats" ON bio_stats FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SHOP_CATEGORIES policies
CREATE POLICY "Public read shop_categories" ON shop_categories FOR SELECT
  USING (true);

CREATE POLICY "Service role manages shop_categories" ON shop_categories FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SHOP_PRODUCTS policies
CREATE POLICY "Public read active shop_products" ON shop_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role manages shop_products" ON shop_products FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SHOP_ORDERS policies
CREATE POLICY "Service role manages shop_orders" ON shop_orders FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- SHOP_ORDER_ITEMS policies
CREATE POLICY "Service role manages shop_order_items" ON shop_order_items FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- INVENTORY_MOVEMENTS policies
CREATE POLICY "Service role manages inventory_movements" ON inventory_movements FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- PAYMENT_PROVIDERS policies
CREATE POLICY "Service role manages payment_providers" ON payment_providers FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- WAITING_LIST policies
CREATE POLICY "Public insert waiting_list" ON waiting_list FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role manages waiting_list" ON waiting_list FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. STORAGE POLICIES (Multi-Tenant Paths)
-- ============================================================================

-- Update storage policies for business-scoped access
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin insert shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read storage" ON storage.objects;

-- Public read for all storage
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT
  USING (true);

-- Service role manages all storage
DROP POLICY IF EXISTS "Service role manages storage" ON storage.objects;
CREATE POLICY "Service role manages storage" ON storage.objects FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_availability_business ON availability_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_business ON blocked_dates(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_date ON bookings(business_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_settings_business ON settings(business_id);
CREATE INDEX IF NOT EXISTS idx_branding_business ON branding(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_bio_profiles_business ON bio_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_shop_categories_business ON shop_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_business ON shop_products(business_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_business ON shop_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_business ON inventory_movements(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_providers_business ON payment_providers(business_id);

-- ============================================================================
-- 12. SECURITY HARDENING
-- ============================================================================

-- Fix function search_path (prevents search_path injection attacks)
ALTER FUNCTION generate_booking_code(UUID) SET search_path = 'public';
ALTER FUNCTION get_business_id_from_admin(TEXT) SET search_path = 'public';
ALTER FUNCTION get_business_id_from_slug(TEXT) SET search_path = 'public';
ALTER FUNCTION has_business_role(UUID, TEXT, TEXT) SET search_path = 'public';

-- Fix existing functions with mutable search_path
ALTER FUNCTION verify_admin_password(TEXT, TEXT) SET search_path = 'public';
ALTER FUNCTION create_admin_user(TEXT, TEXT, TEXT) SET search_path = 'public';
ALTER FUNCTION update_admin_password(TEXT, TEXT, TEXT) SET search_path = 'public';
ALTER FUNCTION update_admin_password_direct(TEXT, TEXT) SET search_path = 'public';
ALTER FUNCTION decrement_stock(UUID, INTEGER, TEXT) SET search_path = 'public';

-- Revoke dangerous function execution from anon/authenticated
-- These functions should only be callable via Edge Functions (service_role)
REVOKE EXECUTE ON FUNCTION create_admin_user FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_admin_password FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_admin_password_direct FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION decrement_stock FROM anon, authenticated;

-- Fix storage: replace broad SELECT with path-scoped policies
DROP POLICY IF EXISTS "Public read storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Select avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;

-- Public can read storage objects (by path scope for security)
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Public read branding" ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "Public read shop-images" ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-images');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
