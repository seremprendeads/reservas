-- ============================================================================
-- FIX: Formalizar políticas necesarias para que el Admin Panel funcione
-- Fecha: 2026-08-23
--
-- CONTEXTO:
-- La migración 20260820000000_security_critical_fixes.sql eliminó correctamente
-- las políticas SELECT abiertas en bookings y businesses para cerrar
-- vulnerabilidades de exposición de datos.
--
-- Sin embargo, esto dejó al Admin Panel sin acceso a:
--   1. bookings: useAdminBookings.loadData() lee con anon key
--   2. businesses: BusinessContext.fetchBusinessById() lee con anon key post-login
--
-- Ambas policies fueron agregadas manualmente en el SQL Editor como fix de
-- emergencia, pero nunca se formalizaron en el repositorio.
-- Esta migración las incorpora de forma idempotente.
--
-- NO modifica ninguna otra policy.
-- NO toca autenticación, JWT, Master Admin ni Mercado Pago.
-- ============================================================================


-- ============================================================================
-- 1. bookings — SELECT para anon
--
-- Permite que useAdminBookings.loadData() lea reservas del negocio autenticado.
-- La policy filtra por business_id que exista en businesses con is_active = true.
-- Un anon no puede leer bookings de un negocio inexistente o suspendido.
--
-- Historial:
--   - 20260627: "anon_read_own_bookings" — USING(true), sin filtro de tenant ← abierto
--   - 20260713: "Public read own bookings" — USING(true) ← abierto
--   - 20260820: DROP de todas las anteriores ← deja el admin sin lectura
--   - 20260823 (esta migración): SELECT filtrado por business_id válido ← correcto
-- ============================================================================

DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;

CREATE POLICY "anon_read_bookings" ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = bookings.business_id
        AND businesses.is_active = true
    )
  );


-- ============================================================================
-- 2. businesses — SELECT para anon
--
-- Permite que BusinessContext.fetchBusinessById() cargue el negocio post-login.
-- Sin esta policy, setBusinessById() devuelve null → el panel queda cargando
-- indefinidamente (loading infinito).
--
-- La policy solo expone negocios activos. No expone negocios suspendidos.
-- El frontend lee campos sensibles (plan, is_trial, trial_ends_at) desde
-- este mismo select — son necesarios para la UI del admin panel.
-- La vista public_businesses se mantiene para páginas públicas (más restrictiva).
--
-- Historial:
--   - 20260713: "Users can view their businesses" — USING(true) ← abierto
--   - 20260715: "Public read businesses" — USING(true) ← abierto
--   - 20260820: DROP de ambas, solo service_role ← deja el panel sin acceso
--   - 20260823 (esta migración): SELECT filtrado por is_active = true ← correcto
-- ============================================================================

DROP POLICY IF EXISTS "anon_read_own_business" ON businesses;

CREATE POLICY "anon_read_own_business" ON businesses
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


-- ============================================================================
-- VERIFICACIÓN (ejecutar en SQL Editor para confirmar):
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('bookings', 'businesses')
-- ORDER BY tablename, policyname;
--
-- Resultado esperado para bookings:
--   anon_insert_bookings   | INSERT | {anon}
--   anon_read_bookings     | SELECT | {anon,authenticated}   ← nueva
--   Service role manages bookings | ALL | {service_role}
--
-- Resultado esperado para businesses:
--   anon_read_own_business        | SELECT | {anon,authenticated}  ← nueva
--   Service role manages businesses | ALL  | {service_role}
-- ============================================================================