-- ============================================================================
-- DATOS LEGALES DEL NEGOCIO
--
-- Alimenta las páginas públicas /:slug/privacidad, /:slug/cookies y
-- /:slug/condiciones. Los documentos NO se guardan: se renderizan en el
-- frontend con estos datos + businesses.name.
--
-- Seguridad multi-tenant:
--   - Tabla nueva, separada de businesses. No se modifica ninguna tabla,
--     vista ni política existente.
--   - RLS activo. Solo service_role puede leer/escribir la tabla.
--     anon/authenticated no tienen ninguna policy → no pueden listar datos
--     legales de todos los negocios.
--   - Escritura: Edge Function admin-legal-info (service_role). El
--     business_id sale del JWT del admin, nunca del body.
--   - Lectura pública: RPC get_public_business_legal_info(p_slug). El negocio
--     se resuelve en la base por slug, solo si está activo, y devuelve una
--     única fila con campos públicos.
--
-- Migración idempotente: se puede ejecutar más de una vez.
-- ============================================================================

-- 1. Tabla
CREATE TABLE IF NOT EXISTS public.business_legal_info (
  business_id   UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  legal_name    TEXT,
  tax_id        TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  country       TEXT,
  contact_email TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_legal_info ENABLE ROW LEVEL SECURITY;

-- 2. Permisos: solo service_role accede directo a la tabla
REVOKE ALL ON TABLE public.business_legal_info FROM anon, authenticated;
GRANT ALL ON TABLE public.business_legal_info TO service_role;

DROP POLICY IF EXISTS "Service role manages business_legal_info" ON public.business_legal_info;
CREATE POLICY "Service role manages business_legal_info" ON public.business_legal_info
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Lectura pública por slug
CREATE OR REPLACE FUNCTION public.get_public_business_legal_info(p_slug TEXT)
RETURNS TABLE (
  business_name TEXT,
  slug          TEXT,
  logo_url      TEXT,
  legal_name    TEXT,
  tax_id        TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  country       TEXT,
  contact_email TEXT,
  phone         TEXT,
  updated_at    TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.name,
    b.slug,
    b.logo_url,
    l.legal_name,
    l.tax_id,
    l.address,
    l.city,
    l.province,
    l.country,
    l.contact_email,
    l.phone,
    l.updated_at
  FROM public.businesses b
  LEFT JOIN public.business_legal_info l ON l.business_id = b.id
  WHERE b.slug = p_slug
    AND b.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_business_legal_info(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_business_legal_info(TEXT) TO anon, authenticated, service_role;

-- ============================================================================
-- VERIFICACIÓN (ejecutar aparte en el SQL Editor):
--
-- a) Políticas de la tabla nueva (esperado: solo "Service role manages business_legal_info"):
--    SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'business_legal_info';
--
-- b) La RPC devuelve una fila para un slug existente (reemplazar 'rock'):
--    SELECT * FROM public.get_public_business_legal_info('rock');
--
-- c) Slug inexistente → 0 filas:
--    SELECT * FROM public.get_public_business_legal_info('no-existe-xyz');
-- ============================================================================
