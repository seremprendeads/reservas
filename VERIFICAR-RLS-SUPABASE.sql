-- ============================================================================
-- BIOWEBLINK - VERIFICACION PREVIA (SOLO LECTURA) ANTES DE APLICAR LAS
-- MIGRACIONES FASE 2 (RLS)
--
-- Ejecutar en el SQL Editor de Supabase (Internet/Local), NUNCA con herramientas
-- que hagan writing. Todas las consultas son SELECT / has_*privilege / pg_*.
-- Este archivo se entrega preparado: no se ejecuto contra ninguna base.
--
-- Archivos a los que da lugar:
--   P0-P4           -> definen H1/H2 (necesarias antes de aplicar migraciones).
--   A1/A2/H6A       -> verificacion previa de las migraciones preparadas.
-- ============================================================================


--------------------------------------------------------------------------------
-- P0. RLS habilitado? (define H2: services / branding / landing_pages)
--     Si relrowsecurity = false en alguna, corre la migracion B.
--------------------------------------------------------------------------------
SELECT
  c.relname                  AS tabla,
  c.relrowsecurity           AS rls_habilitado,
  c.relforcerowsecurity      AS rls_forzado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('services', 'branding', 'landing_pages')
ORDER BY c.relname;


--------------------------------------------------------------------------------
-- P1. Privilegios SELECT efectivos de anon (define H1)
--     Esperado en un entorno sano:
--       anon_lee_businesses = false, anon_lee_services = true, anon_lee_settings = true
--     Si anon_lee_businesses = true en produccion, alguien lo re-granteo a mano:
--       H1 no se manifiesta ahi, pero igual aplicar la migracion A (quita la
--       dependencia) y luego RESTAURAR el REVOKE.
--------------------------------------------------------------------------------
SELECT
  has_table_privilege('anon', 'public.businesses', 'SELECT') AS anon_lee_businesses,
  has_table_privilege('anon', 'public.services',   'SELECT') AS anon_lee_services,
  has_table_privilege('anon', 'public.settings',   'SELECT') AS anon_lee_settings,
  has_table_privilege('authenticated', 'public.businesses', 'SELECT') AS auth_lee_businesses;


--------------------------------------------------------------------------------
-- P2. Inventario real de politicas RLS por tabla (define H1/H2 y descubre
--     politicas desconocidas creadas a mano que NO esten en el repo).
--------------------------------------------------------------------------------
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'bookings', 'waiting_list', 'services', 'branding', 'landing_pages',
    'bio_stats', 'shop_products', 'shop_orders', 'shop_order_items',
    'settings', 'businesses', 'bio_profiles', 'bio_links'
  )
ORDER BY tablename, policyname;


--------------------------------------------------------------------------------
-- P3. Privilegios de ESCRITURA de anon/authenticated sobre tablas publicas
--     (detecta escritura anonima no deseada si RLS estuviera caido).
--------------------------------------------------------------------------------
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
  AND table_schema = 'public'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
ORDER BY table_name, grantee, privilege_type;


--------------------------------------------------------------------------------
-- P4. Funciones SECURITY DEFINER alcanzables por anon fuera de la allowlist.
--     Esperado: 0 filas. La allowlist publica es:
--       generate_booking_code, business_has_module, order_belongs_to_business,
--       get_public_business_legal_info, get_business_id_from_slug
--------------------------------------------------------------------------------
SELECT
  p.oid::regprocedure AS funcion
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
  AND p.proname NOT IN (
    'generate_booking_code', 'business_has_module', 'order_belongs_to_business',
    'get_public_business_legal_info', 'get_business_id_from_slug'
  )
ORDER BY 1;


--------------------------------------------------------------------------------
-- A1. Pre-chequeo migracion A (reservas): definicion REAL actual de las dos
--     policies contra las que se compara el nuevo DDL.
--------------------------------------------------------------------------------
SELECT tablename, policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename = 'bookings'      AND policyname = 'anon_insert_bookings'
       OR tablename = 'waiting_list' AND policyname = 'anon_insert_waiting_list');

-- A1b. Duplicados activos que harian fallar el indice unico (20260921040000).
--      Esperado: 0 filas.
SELECT business_id, booking_date, booking_time, count(*) AS duplicados
FROM bookings
WHERE deleted_at IS NULL AND booking_status <> 'cancelled'
GROUP BY business_id, booking_date, booking_time
HAVING count(*) > 1;

-- A1c. Funcion business_has_module usada por la migracion A (debe existir y
--      ser SECURITY DEFINER, STABLE).
SELECT p.oid::regprocedure AS funcion, p.prosecdef, p.provolatile
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'business_has_module';


--------------------------------------------------------------------------------
-- A2. Pre-chequeo migracion B (RLS): ¿existen las policies canonicas en la
--     base real o hubo policies creadas a mano con otros nombres?
--     Si aparecen politicas de escritura anon en estas tablas, detener la
--     migracion B y reclasificar antes de aplicarla.
--------------------------------------------------------------------------------
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'branding', 'landing_pages')
  AND roles @> ARRAY['anon']::name[]
  AND cmd <> 'SELECT';

-- A2b. Confirmacion de a quien aplica cada policy publica de lectura:
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'branding', 'landing_pages')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;


--------------------------------------------------------------------------------
-- H6A. Pre-chequeo harden bio_stats: politica vigente y columna link_id.
--------------------------------------------------------------------------------
SELECT tablename, policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'bio_stats'
ORDER BY policyname;

SELECT
  has_table_privilege('anon', 'public.public_bio_profiles', 'SELECT') AS anon_lee_vista_perfiles,
  has_table_privilege('anon', 'public.bio_profiles',        'SELECT') AS anon_lee_tabla_perfiles;


--------------------------------------------------------------------------------
-- H3. Confirmar que el webhook correlaciona por booking_code (NO preference_id).
--     Esperado: la consulta de produccion no debe depender de preference_id.
--------------------------------------------------------------------------------
-- (se valida en el codigo de mercadopago-webhook: usa external_reference
--  == booking_code; nada exige preference_id)

-- FIN DE LA VERIFICACION
-- ============================================================================