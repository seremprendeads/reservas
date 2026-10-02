-- ============================================================================
-- C.3 - CERRAR LAS ESCRITURAS ANONIMAS EN STORAGE
--
-- Que estaba roto:
--
--   El login del panel es custom (admin-login devuelve un JWT propio) y en todo
--   el proyecto no hay ningun supabase.auth.*. El browser nunca tiene sesion de
--   Supabase Auth, asi que cada supabase.storage.upload() sale con la anon key.
--
--   Con la anon key no hay auth.uid() ni claim de business contra el que
--   validar: el business_id del path lo elige el cliente. Por eso
--   20260822000000_fix_anon_write_rls.sql tuvo que dejar el bucket branding
--   abierto a anon para que los uploads funcionaran.
--
--   Consecuencia: con la anon key, que es publica y va incrustada en el bundle,
--   cualquier visitante podia escribir o borrar archivos en la carpeta de
--   cualquier negocio. Los business_id son UUID que se ven en las URLs publicas,
--   asi que no hacen falta ni adivinarlos.
--
-- Que hace esta migracion:
--
--   1. Elimina TODA policy de escritura de storage.objects para anon y
--      authenticated. Deja solo lectura publica.
--   2. Deja la escritura exclusivamente en service_role, que es lo que usa la
--      Edge Function admin-storage-upload. Esa funcion si valida que el primer
--      segmento del path sea el business_id del admin autenticado, porque ese
--      valor sale del JWT firmado y no del cuerpo del request.
--
-- Nota sobre shop-images:
--   Sus policies de escritura (20260715090000) exigian un email en
--   request.jwt.claims, que nunca existe en este proyecto. Es decir: nunca
--   quedaron habilitadas y los uploads de imagenes de la tienda ya estaban
--   rotos. Al cerrarlas explicitamente y dejar service_role como unico
--   escritor, ese flujo queda arreglado de paso.
--
-- ORDEN DE APLICACION (importante):
--   1) Esta migracion.
--   2) Desplegar admin-storage-upload.
--   3) Recien ahi usar los uploads nuevos. Si se aplica la migracion antes de
--      desplegar la funcion y el frontend, los uploads quedan caidos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. branding - borrar todas las variantes de policy de escritura que dejo
--    cada migracion anterior, para no depender del orden historico.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon insert branding scoped" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete branding scoped" ON storage.objects;
DROP POLICY IF EXISTS "Anon insert branding"           ON storage.objects;
DROP POLICY IF EXISTS "Anon delete branding"           ON storage.objects;
DROP POLICY IF EXISTS "Admin insert branding"          ON storage.objects;
DROP POLICY IF EXISTS "Admin delete branding"          ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2. shop-images - borrar las policies de escritura que nunca funcionaron.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin insert shop-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete shop-images" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2b. avatars - el bucket no tiene INSERT INTO storage.buckets en ninguna
--     migracion del repo: o se creo a mano, o no existe. Sus subidas ya estaban
--     rotas por falta de policy de INSERT. Se crea solo si falta; si ya existe,
--     DO NOTHING para no pisar limites que el operador haya ajustado a mano.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152,
  ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Comprobacion de que no queda ninguna policy de escritura para anon,
--    authenticated ni public en storage.objects.
--
--    Se chequea el conjunto de roles, no el nombre de la policy, asi que
--    tambien detecta una policy con roles = {public} (que aplica a anon igual).
--    pg_policies no expone bucket_id, asi que el filtro por bucket se hace por
--    el texto de qual/with_check. Esperado: 0 filas.
-- ---------------------------------------------------------------------------
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename  = 'objects'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  AND (
        roles @> ARRAY['anon']::name[]
     OR roles @> ARRAY['authenticated']::name[]
     OR roles @> ARRAY['public']::name[]
  )
  AND policyname NOT ILIKE '%service role%'
  AND (
       COALESCE(qual, '')        ILIKE '%branding%'
    OR COALESCE(qual, '')        ILIKE '%shop-images%'
    OR COALESCE(with_check, '') ILIKE '%branding%'
    OR COALESCE(with_check, '') ILIKE '%shop-images%'
  );

-- ---------------------------------------------------------------------------
-- 4. service_role mantiene acceso total. Se redeclara para que esta migracion
--    sea autonormativa y no dependa de que "Service role manages storage"
--    siga existiendo con la forma exacta de 20260719090000.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role manages storage" ON storage.objects;
CREATE POLICY "Service role manages storage" ON storage.objects FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 5. Lectura publica: se mantiene, acotada a que el objeto este dentro de una
--    carpeta de negocio. Se recrea para dejar esta migracion autonormativa.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

DROP POLICY IF EXISTS "Public read shop-images" ON storage.objects;
CREATE POLICY "Public read shop-images" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shop-images'
    AND (storage.foldername(name))[1] IS NOT NULL
  );