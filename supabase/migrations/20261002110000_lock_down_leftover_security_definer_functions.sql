-- ============================================================================
-- HALLAZGO (F.3, verificacion del 02/10/2026): sobrevivio una funcion
-- SECURITY DEFINER ejecutable por anon/authenticated.
--
--   public.update_branding(uuid, text, ... 14 args ...)
--
-- Es drift: no existe en ninguna migracion del repo ni hay referencia en src/.
-- El frontend guarda el branding con la Edge Function admin-update-branding
-- (AppearanceManager.tsx:127 y ShopAdmin.tsx:1033), que hace el upsert con
-- service_role. El RPC viejo quedo huerfano en la base.
--
-- Como es SECURITY DEFINER (corre como el dueno de la tabla, salteando RLS) y
-- no valida que quien llama sea dueno de p_business_id, cualquiera con la anon
-- key podia pisar el logo, colores y textos de CUALQUIER negocio.
--
-- La migracion 20261001090000 no lo agarro porque revocaba por LISTA DE
-- NOMBRES y esta funcion no figuraba. Esta migracion cierra la clase entera de
-- problema con un BARRIDO: recorre todas las funciones SECURITY DEFINER de
-- public que HOY tienen EXECUTE para anon o authenticated y, salvo la
-- allowlist publica conocida, les quita PUBLIC/anon/authenticated y deja solo
-- service_role. Comprobado con la anon key: update_branding respondia 200.
--
-- Allowlist que debe conservar acceso desde el cliente (listas de la migracion
-- 20261001090000):
--   generate_booking_code, business_has_module, order_belongs_to_business,
--   get_public_business_legal_info, get_business_id_from_slug.
--
-- No cambia planes, trial, modulos, datos ni arquitectura: solo permisos de
-- ejecucion. Idempotente.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  allowlist text[] := ARRAY[
    'generate_booking_code',
    'business_has_module',
    'order_belongs_to_business',
    'get_public_business_legal_info',
    'get_business_id_from_slug'
  ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT (p.proname = ANY (allowlist))
      AND (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICACION (F.3): despues de aplicar, esta consulta debe devolver 0 filas.
--
--   SELECT p.oid::regprocedure
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.prosecdef
--     AND has_function_privilege('anon', p.oid, 'EXECUTE')
--     AND p.proname NOT IN ('generate_booking_code','business_has_module',
--                           'order_belongs_to_business','get_public_business_legal_info',
--                           'get_business_id_from_slug');
-- ============================================================================
