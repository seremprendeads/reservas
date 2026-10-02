-- ============================================================================
-- CRITICO: los "REVOKE EXECUTE ... FROM anon, authenticated" de las migraciones
-- anteriores nunca dejaron sin efecto real al privilegio.
--
-- En PostgreSQL toda funcion nueva nace con EXECUTE concedido al rol PUBLIC.
-- anon y authenticated heredan ese privilegio a traves de PUBLIC. Por eso
--   REVOKE EXECUTE ON FUNCTION f(...) FROM anon, authenticated;
-- quita el permiso SOLO a esos dos roles, pero deja intacto el privilegio que
-- les llega por PUBLIC: el resultado es que la funcion sigue siendo invocable
-- por cualquiera con la anon key (que vive en el bundle JS publico).
--
-- Comprobado en produccion el 01/10/2026 con la anon key: create_master_admin,
-- update_admin_password_direct, update_admin_password_by_id, create_admin_user,
-- verify_admin_password, verify_master_password, decrement_stock y
-- get_business_id_from_admin respondian 200/409, es decir, se ejecutaron.
-- La mas grave es update_admin_password_direct: permite resetear la contrasena
-- de CUALQUIER admin sin autenticarse.
--
-- El patron correcto ya existe en el repo y funciona (ver
-- 20260912000000_plan_module_rls.sql y 20260911000000_business_legal_info.sql):
-- revocar a PUBLIC y despues conceder EXECUTE solo a los roles que lo necesitan.
--
-- Esta migracion no cambia planes, trial, modulos ni arquitectura: solo permisos
-- de ejecucion sobre funciones. Las funciones, tablas, policies y datos quedan
-- intactos.
--
-- Idempotente: se puede ejecutar mas de una vez.
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES EXCLUSIVAS DE service_role
--
-- Todo lo que toca contrasenas o crea cuentas. Ninguna debe ser invocable por
-- un cliente: se llaman desde las Edge Functions, que ya usan service_role
-- (createClient con SUPABASE_SERVICE_ROLE_KEY), asi que service_role conserva
-- EXECUTE y los flujos de admin-login / admin-forgot-password / admin-register /
-- admin-accept-invite / master-login siguen funcionando sin cambios.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'create_master_admin',
        'create_invited_admin',
        'create_admin_user',
        'update_admin_password',
        'update_admin_password_by_id',
        'update_admin_password_direct',
        'verify_admin_password',
        'verify_master_password',
        'get_business_id_from_admin'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- decrement_stock: la usa create-shop-payment (service_role). Se le quita
-- PUBLIC porque decrementar stock no puede ser una operacion de cliente.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'decrement_stock'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ============================================================================
-- 2. FUNCIONES QUE EL FRONTEND PUBLICO SI NECESITA
--
-- Se mantiene el privilegio que ya tenian en la practica, pero ahora de forma
-- explicita y sin depender del regalo de PUBLIC. Si manana alguien vuelve a
-- revocar por rol, estas siguen andando porque el GRANT es explicito.
--
-- generate_booking_code: la llama BookingForm.tsx:68 con la anon key, antes
--   del INSERT en bookings. Sin esto no hay reservas publicas (diagnostico
--   del 01/10/2026, hallazgo C.4).
-- business_has_module: usada dentro de las policies de RLS de bookings,
--   waiting_list, shop_products, shop_orders, shop_order_items y
--   landing_pages. Una policy corre como el rol que consulta, asi que el rol
--   necesita EXECUTE sobre la funcion que invoca.
-- order_belongs_to_business: idem, dentro de la policy de shop_order_items.
-- get_public_business_legal_info: la llama legal.ts:127.
-- get_business_id_from_slug: helper publico de multi-tenant, se deja por
--   compatibilidad con el esquema original.
-- ============================================================================

-- Se recorre POR NOMBRE (no por firma) para tolerar overloads y funciones que
-- existan o no segun el estado real de la base. El esquema y el repo tienen
-- desincronizaciones conocidas: p.ej. order_belongs_to_business solo lo crea la
-- migracion 20260928010000 (aun pendiente), y has_business_role / 
-- get_business_id_from_slug figuraban en el repo pero no existen en produccion.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'generate_booking_code',
        'business_has_module',
        'order_belongs_to_business',
        'get_public_business_legal_info',
        'get_business_id_from_slug'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- has_business_role: helper de multi-tenant sin uso en src/ (grep completo) y
-- sin policies que lo invoquen. Se deja solo para service_role. (Tolerante a
-- ausencia: si no existe en la base, el loop no hace nada.)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'has_business_role'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ============================================================================
-- 3. HELPERS INTERNOS QUE NO DEBEN SER PUBLICOS
--
-- Los invocan triggers o el backend; ningun cliente los necesita.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'increment_support_ticket',
        'set_trial_end_date',
        'reset_ai_credits_for_plan',
        'on_plan_change_reset_credits',
        'bio_free_plan_link_limit'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ============================================================================
-- 4. VERIFICACION
--
-- Ejecutar DESPUES de aplicar. Las que siguen con "anon_*" deben dar false,
-- salvo anon_booking_code y anon_has_module, que deben dar true.
--
--   SELECT
--     has_function_privilege('anon','public.generate_booking_code(uuid)','EXECUTE')              AS anon_booking_code,
--     has_function_privilege('authenticated','public.generate_booking_code(uuid)','EXECUTE')   AS auth_booking_code,
--     has_function_privilege('anon','public.create_master_admin(text,text,text)','EXECUTE')     AS anon_create_master,
--     has_function_privilege('anon','public.update_admin_password_direct(text,text)','EXECUTE') AS anon_reset_pw,
--     has_function_privilege('anon','public.update_admin_password_by_id(uuid,text)','EXECUTE')  AS anon_reset_pw_id,
--     has_function_privilege('anon','public.create_admin_user(text,text,text)','EXECUTE')       AS anon_create_admin,
--     has_function_privilege('anon','public.verify_admin_password(text,text)','EXECUTE')         AS anon_verify_pw,
--     has_function_privilege('anon','public.decrement_stock(uuid,integer,text)','EXECUTE')       AS anon_decrement_stock,
--     has_function_privilege('anon','public.business_has_module(uuid,text)','EXECUTE')           AS anon_has_module;
--
-- Control de que service_role conserva acceso a las funciones de admin:
--   SELECT
--     has_function_privilege('service_role','public.update_admin_password_direct(text,text)','EXECUTE') AS sr_reset_pw,
--     has_function_privilege('service_role','public.create_master_admin(text,text,text)','EXECUTE')   AS sr_create_master,
--     has_function_privilege('service_role','public.verify_admin_password(text,text)','EXECUTE')       AS sr_verify_pw;
--
-- Comprobacion de que ninguna funcion quedo con el regalo de PUBLIC:
--   SELECT p.oid::regprocedure
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname='public' AND has_function_privilege('anon', p.oid, 'EXECUTE')
--     AND p.proname NOT IN ('generate_booking_code','business_has_module',
--                           'order_belongs_to_business','get_public_business_legal_info',
--                           'get_business_id_from_slug');
--   -- esperado: 0 filas
-- ============================================================================