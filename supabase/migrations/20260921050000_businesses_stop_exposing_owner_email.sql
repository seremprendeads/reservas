-- ============================================================================
-- CRITICO: la tabla businesses exponia owner_email (y cualquier columna
-- futura) a CUALQUIERA con la anon key, no solo al dueno logueado
--
-- "anon_read_own_business" (20260823000000_fix_admin_panel_read_access.sql)
-- solo filtra FILAS (is_active = true), nunca COLUMNAS — RLS no puede
-- restringir columnas por policy. Como esta app no usa Supabase Auth,
-- tampoco hay forma de verificar "es el dueno de ESTE negocio" dentro de la
-- policy: cualquiera podia hacer
--   GET /rest/v1/businesses?select=owner_email,plan,trial_ends_at
-- y traerse el email del dueno de TODOS los negocios activos de la
-- plataforma, sin login.
--
-- Revisado el codigo: ningun archivo de src/ usa business.owner_email en
-- absoluto (el tipo Business ni lo declara) — lo unico que el frontend
-- necesita de la tabla businesses, tanto en paginas publicas como en el
-- panel de admin ya logueado, es: id, name, slug, logo_url, timezone,
-- currency, language, is_active, plan, is_trial, trial_ends_at,
-- product_limit. Ninguno de esos es tan sensible como para justificar login
-- (son datos que de una forma u otra ya se infieren visitando el sitio
-- publico del negocio).
--
-- Por eso la vista public_businesses (ya existente, mas segura que la tabla)
-- se extiende para cubrir esos campos, y se saca el acceso anon a la tabla
-- completa: de ahora en mas TODO el acceso de lectura sin autenticar pasa
-- por la vista, que nunca expone owner_email.
-- ============================================================================

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
    is_active,
    plan,
    is_trial,
    trial_ends_at,
    product_limit,
    created_at
  FROM businesses
  WHERE is_active = true;

GRANT SELECT ON public_businesses TO anon, authenticated;

DROP POLICY IF EXISTS "anon_read_own_business" ON businesses;
REVOKE SELECT ON businesses FROM anon, authenticated;
