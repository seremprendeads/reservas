-- ============================================================================
-- FASE 2 - MIGRACION B (H2): garantizar RLS habilitado en services, branding y
-- landing_pages, y la existencia de sus politicas canonicas.
--
-- CONTEXTO (auditoria RLS 2026-10-12, H2):
--   services, branding y landing_pages NO tienen CREATE TABLE ni
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY versionados en ninguna migracion
--   del repo (se crearon a mano: drift historico). Sus policies existen
--   versionadas, pero una policy en una tabla con RLS deshabilitado no filtra
--   nada; la unica barrera quedaria en los GRANT de tabla de Supabase, y si la
--   anon key conserva privilegios de escritura podria escribir en catalogo,
--   branding o landings ajenos.
--
-- QUE HACE:
--   1. Habilita RLS SOLO donde PG diga que esta apagado (relrowsecurity = false).
--   2. Crea las politicas canonicas SOLO si faltan (IF NOT EXISTS), con lo que
--      NO pisa definiciones que existan en la base real:
--      - services     -> "Public read services" (SELECT USING true)
--                        + "Service role manages services" (ALL service_role)
--      - branding     -> "Public read branding" (SELECT USING true)
--                        + "Service role manages branding" (ALL service_role)
--      - landing_pages-> "Public read published landing_pages" (SELECT status='published')
--                        + "Service role manages landing_pages" (ALL service_role)
--   3. NO crea ninguna politica de escritura anonima.
--
-- PRESERVADO:
--   - Lectura publica que piden las paginas: catalogo (BookingPage/ShopAdmin),
--     branding (paginas publicas + panel), landings publicadas.
--   - Escritura administrativa: sigue por service_role (Edge Functions).
--   - La escritura del panel de Tienda/Landing por anon fue eliminada en
--     migraciones previas (20260822000000/20260921030000); aqui no se restaura.
--
-- SEGURIDAD: no se asume que USING(true) sea seguro por si mismo; esta migracion
-- solo cierra el agujero "RLS apagado". El aislamiento entre negocios de las
-- lecturas publicas es un punto de diseño (H5) que se documenta aparte.
--
-- IDEMPOTENTE: se puede correr mas de una vez. No falla si RLS ya estaba activo.
--
-- ANTES DE APLICAR (obligatorio):
--   Ejecutar P0 y A2 del archivo VERIFICAR-RLS-SUPABASE.sql.
--   - Si P0 confirma RLS activo en las tres tablas y las policies canonicas ya
--     existen, esta migracion es un NO-OP intencional.
--   - Si A2 descubre politicas anonimas de ESCRITURA creadas a mano en alguna de
--     estas tablas, NO aplicar esta migracion sin antes documentarlas y
--     eliminarlas (apareceria un write-path anonimo tras habilitar RLS).
-- ============================================================================


-- 1) Habilitar RLS solo donde hace falta ------------------------------------
DO $$
DECLARE
  v_rel text;
  v_rls boolean;
BEGIN
  FOREACH v_rel IN ARRAY ARRAY['services', 'branding', 'landing_pages'] LOOP
    SELECT c.relrowsecurity INTO v_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = v_rel;

    IF v_rls IS NULL THEN
      RAISE EXCEPTION 'Tabla public.% no existe en la base; aborto la migracion B.', v_rel;
    END IF;

    IF NOT v_rls THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_rel);
      RAISE NOTICE 'RLS habilitado en public.%', v_rel;
    ELSE
      RAISE NOTICE 'RLS ya habilitado en public.% (no-op)', v_rel;
    END IF;
  END LOOP;
END $$;


-- 2) Políticas canónicas SOLO si faltan (no pisan definiciones reales) --------

DO $$
BEGIN
  -- SERVICES
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Public read services'
  ) THEN
    CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'Service role manages services'
  ) THEN
    CREATE POLICY "Service role manages services" ON public.services
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- BRANDING
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'branding' AND policyname = 'Public read branding'
  ) THEN
    CREATE POLICY "Public read branding" ON public.branding FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'branding' AND policyname = 'Service role manages branding'
  ) THEN
    CREATE POLICY "Service role manages branding" ON public.branding
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- LANDING_PAGES
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'landing_pages' AND policyname = 'Public read published landing_pages'
  ) THEN
    CREATE POLICY "Public read published landing_pages" ON public.landing_pages
      FOR SELECT USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'landing_pages' AND policyname = 'Service role manages landing_pages'
  ) THEN
    CREATE POLICY "Service role manages landing_pages" ON public.landing_pages
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ============================================================================
-- VERIFICACION (ejecutar aparte, SOLO lectura):
--   SELECT c.relname, c.relrowsecurity
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relname IN ('services','branding','landing_pages');
--
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('services','branding','landing_pages')
--   ORDER BY tablename, policyname;
-- ============================================================================