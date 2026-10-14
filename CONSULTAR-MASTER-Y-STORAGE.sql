-- ============================================================================
-- DIAGNOSTICO MASTER ADMIN + CREDENCIALES EN EL ENTORNO
-- SOLO LECTURA. No modifica nada. Correr en el SQL Editor de Supabase.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Las cuentas master que existen, con antiguedad de la ultima actividad.
--    created_at / updated_at permiten ver si la del tutorial esta en uso.
--    NO se seleccionan password_hash: no hace falta y no debe imprimirse.
-- ---------------------------------------------------------------------------
SELECT
  email,
  name,
  is_active,
  created_at,
  updated_at,
  (updated_at - created_at) AS actividad_posterior_al_creado
FROM master_admins
ORDER BY created_at;

-- ---------------------------------------------------------------------------
-- 2. Si un master deja de actualizar una fila, updated_at se mueve. Por eso una
--    cuenta con updated_at = created_at y distinta de la fecha de la
--    migracion (2026-08-21) es que nunca se uso.
-- ---------------------------------------------------------------------------
SELECT
  email,
  CASE
    WHEN updated_at > created_at THEN 'PARECE EN USO (hubo cambios despues de crearse)'
    ELSE 'SIN USO APARENTE (nunca se actualizo)'
  END AS estado,
  updated_at - created_at AS ventana
FROM master_admins;

-- ---------------------------------------------------------------------------
-- 3. Cuantos negocios hay y cuantos tenants activos: si la plataforma esta
--    realmente en uso. Define si esto es una betaearly o una demo.
-- ---------------------------------------------------------------------------
SELECT
  count(*) AS negocios_total,
  count(*) FILTER (WHERE is_active) AS negocios_activos,
  count(*) FILTER (WHERE is_trial) AS en_trial
FROM businesses;

-- ---------------------------------------------------------------------------
-- 4. Actividad reciente de tenants: creada la bio mas recientemente?
--    Si hay biosProfiles con created_at reciente, hay uso real del panel.
-- ---------------------------------------------------------------------------
SELECT
  count(*) AS bio_profiles_total,
  max(created_at) AS bio_mas_reciente,
  max(updated_at) AS bio_editada_mas_reciente
FROM bio_profiles;

-- ---------------------------------------------------------------------------
-- 5. C.3 - Estado real de las policies de storage del bucket branding.
--    Esto NO se puede responder leyendo el repo: el repo y la base pueden
--    haber divergido (ya paso con 20260928010000).
-- ---------------------------------------------------------------------------
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (qual ILIKE '%branding%' OR with_check ILIKE '%branding%')
ORDER BY policyname;

-- ---------------------------------------------------------------------------
-- 6. C.3 - Carpetas que existen hoy dentro de branding. Si aparece alguna que
--    no sea el business_id de un negocio real (ej. 'default'), son archivos
--    subidos con el pathPrefix de fallback del frontend.
--    Solo nombres de carpeta: ningun archivo se lee ni se modifica.
-- ---------------------------------------------------------------------------
SELECT
  (storage.foldername(name))[1] AS carpeta,
  count(*) AS archivos
FROM storage.objects
WHERE bucket_id = 'branding'
GROUP BY 1
ORDER BY 1;

-- Las carpetas anteriores que NO corresponden a un negocio existente:
SELECT DISTINCT (storage.foldername(o.name))[1] AS carpeta_huerfana
FROM storage.objects o
WHERE o.bucket_id = 'branding'
  AND NOT EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id::text = (storage.foldername(o.name))[1]
  );

-- ---------------------------------------------------------------------------
-- 7. F.1 - TABLE PRIVILEGES: permisos de tabla por rol. anon NO debe tener
--    nada sobre tablas sensibles.
-- ---------------------------------------------------------------------------
SELECT table_name, grantee,
       has_table_privilege(grantee, 'public.' || table_name, 'SELECT') AS can_select,
       has_table_privilege(grantee, 'public.' || table_name, 'INSERT') AS can_insert,
       has_table_privilege(grantee, 'public.' || table_name, 'UPDATE') AS can_update,
       has_table_privilege(grantee, 'public.' || table_name, 'DELETE') AS can_delete
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
  AND table_name IN (
    'admin_users', 'master_admins', 'bio_profiles', 'bio_links',
    'bookings', 'shop_orders', 'payment_providers', 'business_legal_info'
  )
ORDER BY table_name, grantee;

-- ============================================================================
-- F.2 / F.3 - ROUTINE PRIVILEGES (has_function_privilege)
--
-- Correr DESPUES de aplicar 20261001090000. Es la verificacion formal de lo
-- que hasta ahora solo se comprobo observando el codigo de respuesta HTTP.
--
-- Bloque A: privileged que NO deben ser ejecutables por anon/authenticated.
--           Todas deben dar false.
-- ============================================================================
SELECT
  has_function_privilege('anon', 'public.create_master_admin(text,text,text)', 'EXECUTE')             AS f_create_master,
  has_function_privilege('anon', 'public.update_admin_password_direct(text,text)', 'EXECUTE')        AS f_reset_pw_direct,
  has_function_privilege('anon', 'public.update_admin_password_by_id(uuid,text)', 'EXECUTE')         AS f_reset_pw_by_id,
  has_function_privilege('anon', 'public.create_admin_user(text,text,text)', 'EXECUTE')              AS f_create_admin,
  has_function_privilege('anon', 'public.create_invited_admin(text,text,text,uuid)', 'EXECUTE')       AS f_create_invited,
  has_function_privilege('anon', 'public.verify_admin_password(text,text)', 'EXECUTE')                AS f_verify_admin_pw,
  has_function_privilege('anon', 'public.verify_master_password(text,text)', 'EXECUTE')               AS f_verify_master_pw,
  has_function_privilege('anon', 'public.decrement_stock(uuid,integer,text)', 'EXECUTE')              AS f_decrement_stock,
  has_function_privilege('anon', 'public.get_business_id_from_admin(text)', 'EXECUTE')                AS f_gbid_from_admin,
  has_function_privilege('authenticated', 'public.update_admin_password_direct(text,text)', 'EXECUTE') AS f_auth_reset_pw;

-- ---------------------------------------------------------------------------
-- Bloque B: privilege que SI deben tener anon/authenticated.
--           Todas deben dar true (si alguna da false, se rompio un flujo).
-- ---------------------------------------------------------------------------
SELECT
  has_function_privilege('anon', 'public.generate_booking_code(uuid)', 'EXECUTE')             AS f_anon_booking_code,
  has_function_privilege('authenticated', 'public.generate_booking_code(uuid)', 'EXECUTE')     AS f_auth_booking_code,
  has_function_privilege('anon', 'public.business_has_module(uuid,text)', 'EXECUTE')            AS f_anon_has_module,
  has_function_privilege('anon', 'public.order_belongs_to_business(uuid,uuid)', 'EXECUTE')     AS f_anon_order_belongs,
  has_function_privilege('anon', 'public.get_public_business_legal_info(text)', 'EXECUTE')     AS f_anon_legal_info;

-- ---------------------------------------------------------------------------
-- Bloque C: service_role NO puede perder acceso. Si alguna da false, el login
--           y el reset de contrasena se rompen.
-- ---------------------------------------------------------------------------
SELECT
  has_function_privilege('service_role', 'public.update_admin_password_direct(text,text)', 'EXECUTE') AS f_sr_reset_pw,
  has_function_privilege('service_role', 'public.update_admin_password_by_id(uuid,text)', 'EXECUTE')  AS f_sr_reset_pw_id,
  has_function_privilege('service_role', 'public.create_admin_user(text,text,text)', 'EXECUTE')       AS f_sr_create_admin,
  has_function_privilege('service_role', 'public.verify_admin_password(text,text)', 'EXECUTE')       AS f_sr_verify_pw,
  has_function_privilege('service_role', 'public.create_master_admin(text,text,text)', 'EXECUTE')     AS f_sr_create_master,
  has_function_privilege('service_role', 'public.verify_master_password(text,text)', 'EXECUTE')       AS f_sr_verify_master;

-- ---------------------------------------------------------------------------
-- Bloque D (el mas importante): barrido de TODAS las funciones SECURITY
-- DEFINER que anon puede ejecutar. Esperado: 0 filas.
--           Cualquier fila que aparezca es una funcion con privilegio PUBLIC
--           sin cerrar, que es exactamente el problema que causo todo esto.
-- ---------------------------------------------------------------------------
SELECT p.oid::regprocedure AS funcion_filtrada,
       p.prosecdef AS security_definer
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

-- ---------------------------------------------------------------------------
-- Bloque E: barrido de TODAS las funciones (no solo SECURITY DEFINER) que
-- anon puede ejecutar. Sirve para detectar funciones de sistema o de terceros
-- que el repo no conoce. Esperado: solo las 5 del bloque D mas las de
-- lectura auxiliar que ya son inofensivas.
-- ---------------------------------------------------------------------------
SELECT p.oid::regprocedure AS funcion_ejecutable_por_anon
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
ORDER BY 1;