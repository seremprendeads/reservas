-- ============================================================================
-- SECURITY CRITICAL FIXES
-- Fecha: 2026-08-20
-- Resuelve los 5 problemas críticos detectados en la auditoría de seguridad.
-- ============================================================================

-- ============================================================================
-- 1. CORREGIR RLS DE bookings (SELECT)
--
-- PROBLEMA: "Public read own bookings" usaba USING (true) — cualquier usuario
-- anónimo podía leer TODAS las reservas de TODOS los tenants con la anon key,
-- incluyendo nombres, emails y teléfonos de clientes.
--
-- SOLUCIÓN: Eliminar la política de SELECT para anon/authenticated.
-- Las lecturas de reservas pasan exclusivamente por Edge Functions (service_role).
-- El flujo público de confirmación (BookingPage) también usa Edge Functions.
-- ============================================================================

DROP POLICY IF EXISTS "Public read own bookings" ON bookings;
DROP POLICY IF EXISTS "anon_read_own_bookings" ON bookings;
DROP POLICY IF EXISTS "Public read own bookings by email" ON bookings;

-- Ya no hay SELECT para anon. Solo service_role puede leer bookings.
-- La política "Service role manages bookings" ya existente cubre esto.

-- ============================================================================
-- 2. CORREGIR anon_insert_bookings
--
-- PROBLEMA: La política solo verificaba business_id IS NOT NULL.
-- Un usuario malintencionado podía insertar bookings con cualquier business_id,
-- incluyendo UUIDs de otros tenants o UUIDs inventados.
--
-- SOLUCIÓN: Verificar que el business_id corresponde a un negocio activo real.
-- ============================================================================

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "Public insert bookings" ON bookings;

CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
        AND businesses.is_active = true
    )
  );

-- ============================================================================
-- 3. CORREGIR anon_insert_waiting_list (mismo problema)
--
-- PROBLEMA: Solo verificaba business_id IS NOT NULL.
-- SOLUCIÓN: Verificar negocio activo existente.
-- ============================================================================

DROP POLICY IF EXISTS "anon_insert_waiting_list" ON waiting_list;
DROP POLICY IF EXISTS "Public insert waiting_list" ON waiting_list;

CREATE POLICY "anon_insert_waiting_list" ON waiting_list FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = waiting_list.business_id
        AND businesses.is_active = true
    )
  );

-- ============================================================================
-- 4. RESTRINGIR SELECT público en businesses
--
-- PROBLEMA: La política "Public read businesses" con SELECT * exponía
-- owner_email, plan, trial_ends_at, is_trial con la anon key, permitiendo
-- enumerar todos los tenants y sus datos sensibles.
--
-- SOLUCIÓN: Reemplazar con una vista de solo lectura con campos seguros,
-- y restringir la política directa a service_role.
-- El frontend solo necesita: id, name, slug, is_active, timezone, currency, logo_url.
-- ============================================================================

-- Eliminar política pública actual
DROP POLICY IF EXISTS "Public read businesses" ON businesses;

-- Nueva política: solo service_role accede directamente a la tabla businesses
-- El frontend usa la vista pública (ver abajo)
CREATE POLICY "Service role manages businesses" ON businesses FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Vista pública con solo los campos seguros necesarios para el frontend
-- (resolución de slug → id, nombre para mostrar, moneda, zona horaria)
DROP VIEW IF EXISTS public_businesses;
CREATE VIEW public_businesses AS
  SELECT
    id,
    name,
    slug,
    logo_url,
    timezone,
    currency,
    language,
    is_active
  FROM businesses
  WHERE is_active = true;

-- La vista no hereda RLS pero solo expone campos seguros
GRANT SELECT ON public_businesses TO anon, authenticated;

-- ============================================================================
-- 5. TRIAL: Actualizar duración a 18 días
--
-- CAMBIO COMERCIAL: La beta directa con prospectos usa 18 días de prueba.
-- (Los 14 días para otro canal se decidirá luego.)
-- Actualizar el trigger para nuevos negocios.
-- Los negocios existentes en trial activo NO se tocan — solo afecta nuevos.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    -- 18 días para la beta de prospección directa
    NEW.trial_ends_at := now() + interval '18 days';
    NEW.is_trial := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- El trigger ya existe (trg_set_trial_end), solo actualizar la función es suficiente.
-- No necesitamos DROP/CREATE del trigger.

-- ============================================================================
-- 6. ÍNDICE: mejorar performance del nuevo WITH CHECK en INSERT bookings
--    (la subquery EXISTS busca por businesses.id)
-- El índice PRIMARY KEY de businesses ya cubre esto — no se necesita índice extra.
-- ============================================================================

-- ============================================================================
-- VERIFICACIÓN: listar políticas activas en bookings y businesses
-- (Ejecutar manualmente para confirmar en producción)
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('bookings', 'businesses', 'waiting_list')
-- ORDER BY tablename, policyname;
-- ============================================================================

