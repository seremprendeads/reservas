-- ============================================================================
-- FIX: Anon write vulnerabilities in RLS
-- Fecha: 2026-08-22
--
-- PROBLEMA: Las migraciones 20260722000001 (services), 20260722000007 (shop) y
-- 20260722000000 (landing_pages + branding storage) crearon políticas del tipo:
--   FOR ALL USING (true) WITH CHECK (true)
-- sin ningún filtro de business_id, permitiendo a cualquier usuario anónimo
-- con la anon key crear, modificar o eliminar datos de cualquier tenant.
--
-- SOLUCIÓN: Reemplazar las políticas peligrosas por políticas que:
--   1. Para tablas donde el admin escribe vía Edge Functions (services):
--      → solo service_role puede escribir.
--   2. Para tablas donde el frontend escribe directamente vía anon key
--      (shop_*, landing_pages, storage):
--      → validar que business_id corresponde a un negocio activo existente.
--
-- PRINCIPIO: Ningún anónimo puede escribir datos sin un business_id válido
--            que exista en la tabla businesses (con is_active = true).
-- ============================================================================


-- ============================================================================
-- 1. SERVICES
--
-- Situación anterior (20260722000001):
--   "Anon manage services" FOR ALL USING (true) WITH CHECK (true)  ← PELIGROSO
--
-- El frontend NO escribe servicios directamente: usa authInvoke() →
-- admin-manage-services Edge Function → service_role client.
-- Ver: src/pages/admin/ServicesManager.tsx (save, toggleActive, remove)
--
-- Por lo tanto, la escritura anon es innecesaria. Solo se necesita:
--   - SELECT anon (booking page pública + admin listado)
--   - ALL service_role (Edge Function usa service_role client)
-- ============================================================================

DROP POLICY IF EXISTS "Anon manage services" ON services;
DROP POLICY IF EXISTS "Public read services" ON services;
DROP POLICY IF EXISTS "Service role manages services" ON services;

-- Lectura pública: booking page y admin panel la necesitan
CREATE POLICY "Public read services" ON services
  FOR SELECT
  USING (true);

-- Escritura exclusiva via service_role (Edge Functions)
CREATE POLICY "Service role manages services" ON services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 2. SHOP_PRODUCTS
--
-- Situación anterior (20260722000007):
--   "Anon manage shop_products" FOR ALL USING (true) WITH CHECK (true)  ← PELIGROSO
--
-- El admin escribe directamente vía supabase anon client (ShopAdmin.tsx).
-- Todos los inserts incluyen business_id: business.id en el payload.
-- Ver: src/modules/shop/admin/ShopAdmin.tsx líneas 270-310, 292, 297, 307, 625, 634, 644
--
-- La tienda pública solo lee (ShopPage.tsx).
--
-- Fix: separar SELECT por caso de uso + restringir writes a business_id válido.
-- ============================================================================

DROP POLICY IF EXISTS "Anon manage shop_products" ON shop_products;
DROP POLICY IF EXISTS "Public read active shop_products" ON shop_products;
DROP POLICY IF EXISTS "Service role manages shop_products" ON shop_products;

-- Lectura pública: tienda muestra solo productos activos y no eliminados
CREATE POLICY "Public read active shop_products" ON shop_products
  FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);

-- Lectura admin: necesita ver inactivos y en papelera también
-- (el admin filtra por business_id en el query, no en la política)
CREATE POLICY "Anon read all shop_products" ON shop_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura anon: solo si business_id es válido (negocio activo real)
-- Esto previene escritura en tenants inexistentes o falsos
CREATE POLICY "Anon write shop_products" ON shop_products
  FOR ALL
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = shop_products.business_id
        AND businesses.is_active = true
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

-- service_role para Edge Functions
CREATE POLICY "Service role manages shop_products" ON shop_products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 3. SHOP_CATEGORIES
--
-- Situación anterior (20260722000007):
--   "Anon manage shop_categories" FOR ALL USING (true) WITH CHECK (true)  ← PELIGROSO
--
-- Admin escribe directamente. Ver: ShopAdmin.tsx líneas 504, 511.
-- Todos los inserts incluyen business_id: business.id.
-- ============================================================================

DROP POLICY IF EXISTS "Anon manage shop_categories" ON shop_categories;
DROP POLICY IF EXISTS "Public read shop_categories" ON shop_categories;
DROP POLICY IF EXISTS "Service role manages shop_categories" ON shop_categories;

-- Lectura pública para la tienda
CREATE POLICY "Public read shop_categories" ON shop_categories
  FOR SELECT
  USING (true);

-- Escritura anon solo con business_id válido
CREATE POLICY "Anon write shop_categories" ON shop_categories
  FOR ALL
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = shop_categories.business_id
        AND businesses.is_active = true
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

CREATE POLICY "Service role manages shop_categories" ON shop_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 4. SHOP_ORDERS
--
-- Situación anterior (20260722000007):
--   "Anon manage shop_orders" FOR ALL USING (true) WITH CHECK (true)  ← PELIGROSO
--
-- Dos actores escriben:
--   a) Cliente público (checkout): INSERT en ShopPage.tsx con business_id: business?.id
--   b) Admin: DELETE en ShopAdmin.tsx con .eq('business_id', business?.id)
--      y UPDATE (preference_id) con .eq('business_id', business?.id)
-- Lectura: admin y polling de estado de pago.
-- ============================================================================

DROP POLICY IF EXISTS "Anon manage shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Service role manages shop_orders" ON shop_orders;

-- Lectura anon (admin + polling de pago en ShopPage)
CREATE POLICY "Anon read shop_orders" ON shop_orders
  FOR SELECT
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = shop_orders.business_id
        AND businesses.is_active = true
    )
  );

-- Escritura anon solo con business_id válido
CREATE POLICY "Anon write shop_orders" ON shop_orders
  FOR ALL
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = shop_orders.business_id
        AND businesses.is_active = true
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

CREATE POLICY "Service role manages shop_orders" ON shop_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 5. SHOP_ORDER_ITEMS
--
-- Situación anterior (20260722000007):
--   "Anon manage shop_order_items" FOR ALL USING (true) WITH CHECK (true)  ← PELIGROSO
--
-- Dos actores escriben:
--   a) Cliente público (checkout): INSERT en ShopPage.tsx con business_id: business?.id
--   b) Admin: DELETE en ShopAdmin.tsx con .eq('business_id', business?.id)
-- ============================================================================

DROP POLICY IF EXISTS "Anon manage shop_order_items" ON shop_order_items;
DROP POLICY IF EXISTS "Service role manages shop_order_items" ON shop_order_items;

-- Escritura anon solo con business_id válido
CREATE POLICY "Anon write shop_order_items" ON shop_order_items
  FOR ALL
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = shop_order_items.business_id
        AND businesses.is_active = true
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

CREATE POLICY "Service role manages shop_order_items" ON shop_order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 6. LANDING_PAGES
--
-- Situación anterior (20260722000000):
--   "Anon can read landing pages"   FOR SELECT USING (true)     ← abierto, ok para lectura
--   "Anon can insert landing pages" FOR INSERT WITH CHECK (true) ← PELIGROSO
--   "Anon can update landing pages" FOR UPDATE USING (true)      ← PELIGROSO
--   "Anon can delete landing pages" FOR DELETE USING (true)      ← PELIGROSO
--
-- El admin escribe directamente vía anon client (useLandingCrud.ts).
-- Todos los inserts incluyen business_id: business.id.
-- Todos los updates usan .eq('id', landing.id) — el id viene de la carga previa
-- filtrada por business_id (.eq('business_id', business.id)).
-- ============================================================================

DROP POLICY IF EXISTS "Anon can read landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Anon can insert landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Anon can update landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Anon can delete landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can read published landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Service role manages landing_pages" ON landing_pages;
-- limpiar también la política previa de 20260721 (usa auth.jwt() que no funciona)
DROP POLICY IF EXISTS "Owner can manage own landing pages" ON landing_pages;

-- Lectura pública: páginas publicadas (para LandingPage.tsx público)
CREATE POLICY "Public read published landing_pages" ON landing_pages
  FOR SELECT
  USING (status = 'published');

-- Lectura admin: necesita ver borradores propios (filtra por business_id en el query)
CREATE POLICY "Anon read landing_pages" ON landing_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT: solo si business_id es válido
CREATE POLICY "Anon insert landing_pages" ON landing_pages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

-- UPDATE: solo si la fila ya pertenece a un negocio activo
-- (el admin siempre filtra por id de su propia landing page)
CREATE POLICY "Anon update landing_pages" ON landing_pages
  FOR UPDATE
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = landing_pages.business_id
        AND businesses.is_active = true
    )
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

-- DELETE: solo si la fila ya pertenece a un negocio activo
CREATE POLICY "Anon delete landing_pages" ON landing_pages
  FOR DELETE
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = landing_pages.business_id
        AND businesses.is_active = true
    )
  );

-- service_role para operaciones internas
CREATE POLICY "Service role manages landing_pages" ON landing_pages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 7. STORAGE — bucket branding
--
-- Situación anterior (20260722000000):
--   "Anon insert branding" FOR INSERT WITH CHECK (bucket_id = 'branding') ← sin path check
--   "Anon delete branding" FOR DELETE USING (bucket_id = 'branding')      ← sin path check
--
-- Todos los uploads al bucket branding usan el path: {business_id}/{filename}
-- Ver:
--   - useLandingUpload.ts: path = `${business.id}/landing-${target}-${Date.now()}.webp`
--   - useImageUpload.ts:   path = `${pathPrefix}/${filePrefix}-${Date.now()}.webp`
--                          donde pathPrefix = business?.id || 'default'
--
-- Fix: requerir que el path empiece con una carpeta (foldername[1] IS NOT NULL).
-- Esto garantiza que los archivos estén en un subdirectorio, no en la raíz.
-- No podemos verificar que el folder sea el business_id correcto sin Supabase Auth,
-- pero esta política al menos impide uploads anónimos a la raíz del bucket.
-- ============================================================================

DROP POLICY IF EXISTS "Anon insert branding" ON storage.objects;
DROP POLICY IF EXISTS "Admin insert branding" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete branding" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete branding" ON storage.objects;

-- INSERT: el path debe estar en un subdirectorio (no en raíz)
-- Todos los uploads del sistema usan {business_id}/... como primer folder
CREATE POLICY "Anon insert branding scoped" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (storage.foldername(name))[1] != ''
  );

-- DELETE: solo archivos en subdirectorio
CREATE POLICY "Anon delete branding scoped" ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND (storage.foldername(name))[1] != ''
  );

-- ============================================================================
-- VERIFICACIÓN RÁPIDA (ejecutar manualmente en Supabase SQL Editor)
-- ============================================================================
-- SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN (
--   'services', 'shop_products', 'shop_categories',
--   'shop_orders', 'shop_order_items', 'landing_pages'
-- )
-- ORDER BY tablename, policyname;
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND policyname LIKE '%branding%';
-- ============================================================================