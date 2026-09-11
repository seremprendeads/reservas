-- ============================================================================
-- ACCESO POR MÓDULO SEGÚN EL PLAN (Tienda y Sitio web)
--
-- Contexto: el panel oculta los módulos que el plan no incluye, pero la base
-- no lo controlaba: cualquier negocio activo podía escribir en shop_products
-- y landing_pages. Estas dos tablas se escriben directo desde el frontend
-- (no pasan por Edge Functions), así que el control va en RLS.
--
-- Planes (deben coincidir con PLAN_MODULES en
-- src/modules/subscription/lib/constants.ts):
--   free              → bio
--   bio_pro           → bio
--   bio_reservas      → bio, reservas
--   bio_reservas_web  → bio, reservas, landing
--   pro (anterior)    → bio, reservas, landing, shop
--   enterprise        → todo (Plan 5 · Todo completo)
--   trial vigente     → todo
--
-- No se tocan las policies de lectura: las páginas públicas siguen igual.
-- Migración idempotente: se puede ejecutar más de una vez.
-- ============================================================================

-- 1. Función que responde si un negocio tiene habilitado un módulo
CREATE OR REPLACE FUNCTION public.business_has_module(p_business_id UUID, p_module TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.is_active = true
      AND (
        -- Trial vigente: acceso completo
        (b.is_trial = true AND (b.trial_ends_at IS NULL OR b.trial_ends_at > now()))
        -- Planes pagos: según los módulos que incluyen
        OR (b.is_trial = false AND b.plan = 'enterprise')
        OR (b.is_trial = false AND b.plan = 'pro' AND p_module IN ('bio', 'reservas', 'landing', 'shop'))
        OR (b.is_trial = false AND b.plan = 'bio_reservas_web' AND p_module IN ('bio', 'reservas', 'landing'))
        OR (b.is_trial = false AND b.plan = 'bio_reservas' AND p_module IN ('bio', 'reservas'))
        OR (b.is_trial = false AND b.plan IN ('free', 'bio_pro', 'starter') AND p_module = 'bio')
      )
  );
$$;

REVOKE ALL ON FUNCTION public.business_has_module(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.business_has_module(UUID, TEXT) TO anon, authenticated, service_role;


-- 2. TIENDA: shop_products
-- Se mantiene la condición existente (negocio activo) y se suma el plan.
DROP POLICY IF EXISTS "Anon write shop_products" ON public.shop_products;
CREATE POLICY "Anon write shop_products" ON public.shop_products
  FOR ALL
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
  );


-- 3. SITIO WEB: landing_pages
DROP POLICY IF EXISTS "Anon insert landing_pages" ON public.landing_pages;
CREATE POLICY "Anon insert landing_pages" ON public.landing_pages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'landing')
  );

DROP POLICY IF EXISTS "Anon update landing_pages" ON public.landing_pages;
CREATE POLICY "Anon update landing_pages" ON public.landing_pages
  FOR UPDATE
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'landing')
  )
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'landing')
  );

DROP POLICY IF EXISTS "Anon delete landing_pages" ON public.landing_pages;
CREATE POLICY "Anon delete landing_pages" ON public.landing_pages
  FOR DELETE
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'landing')
  );

-- ============================================================================
-- VERIFICACIÓN (ejecutar aparte en el SQL Editor):
--
-- a) La función responde según el plan (reemplazar el slug si hace falta):
--    SELECT b.name, b.plan, b.is_trial,
--           public.business_has_module(b.id, 'shop')   AS tienda,
--           public.business_has_module(b.id, 'landing') AS sitio_web,
--           public.business_has_module(b.id, 'reservas') AS reservas
--    FROM public.businesses b
--    WHERE b.slug = 'rock';
--
-- b) Las policies quedaron con la condición del plan:
--    SELECT tablename, policyname FROM pg_policies
--    WHERE tablename IN ('shop_products','landing_pages') AND policyname LIKE 'Anon%';
-- ============================================================================
