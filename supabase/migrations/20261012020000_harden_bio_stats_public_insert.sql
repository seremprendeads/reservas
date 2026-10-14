-- ============================================================================
-- FASE 2 - MIGRACION C (H6, baja prioridad): endurecer el INSERT publico en
-- bio_stats para no registrar eventos con perfiles inexistentes o inactivos.
--
-- CONTEXTO (auditoria RLS 2026-10-12, H6):
--   "Public insert bio_stats" (20260719090000) pide solo `profile_id IS NOT
--   NULL`. La FK profile_id -> bio_profiles(id) ON DELETE CASCADE ya impide
--   perfiles inexistentes, pero nada frena disparar eventos contra un perfil
--   INACTIVO (is_active = false). Con la anon key se pueden inflar metricas de
--   cualquier perfil de la plataforma.
--
-- SOLUCION (minima):
--   Validar contra la vista public.bio_profiles (publica, se le otorgo SELECT
--   a anon en 20260921070000), que ya filtra is_active = true. NO se usa la
--   tabla real bio_profiles porque anon
--   perdio el SELECT ahi y el subselect tiraria 42501 (el mismo fallo de H1).
--
-- NO ROMPE NADA:
--   - El rastreo publico (BioPage.tsx:52,58) sigue insertando 'visit'/'click'
--     para el perfil activo de su negocio: pasa limpiamente.
--   - El panel y las Edge Functions usan service_role; no pasan por esta policy.
--   - No se toca la recoleccion publica ni su forma de escritura, solo se
--     agrega la condicion is_active.
--
-- SIN FUGA: la vista public_bio_profiles no expone columnas sensibles
-- (no incluye admin_email) y la policy no devuelve filas, solo valida la
-- existencia de un perfil activo dentro del WITH CHECK.
--
-- IDEMPOTENTE: DROP POLICY IF EXISTS + CREATE POLICY; se puede correr varias
-- veces. REVERSION: reempaquetar la policy anterior (WITH CHECK profile_id IS
-- NOT NULL) del 20260719090000.
-- ============================================================================

DROP POLICY IF EXISTS "Public insert bio_stats" ON bio_stats;

CREATE POLICY "Public insert bio_stats" ON bio_stats FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public_bio_profiles
      WHERE public_bio_profiles.id = bio_stats.profile_id
    )
  );


-- ============================================================================
-- VERIFICACION (ejecutar aparte, SOLO lectura):
--   SELECT tablename, policyname, with_check
--   FROM pg_policies WHERE tablename = 'bio_stats' AND policyname = 'Public insert bio_stats';
--
-- En STAGING: insertar un evento con un profile_id de un negocio inactivo debe
-- ser rechazado (42501/RLS), y con un profile activo de ese negocio debe
-- aceptarse. Nunca en produccion.
-- ============================================================================