-- ============================================================================
-- CRITICO: landing_pages se podia escribir con la anon key sin verificar dueno
--
-- "Anon insert/update/delete landing_pages" solo validaban que el
-- business_id targeteado corresponda a un negocio activo (y, para
-- insert/update, que tenga el modulo landing) — nunca que quien hace el
-- pedido sea el admin de ESE negocio. Como la app no usa Supabase Auth, RLS
-- no tiene forma de verificar identidad para una escritura anonima: cualquier
-- visitante que supiera el business_id de OTRO negocio (aparece en su propia
-- landing/bio publica) podia crear, editar o borrar la landing de ese
-- negocio sin loguearse.
--
-- Verificado antes de aplicar: el panel de admin ya escribe landing_pages
-- exclusivamente via la Edge Function admin-manage-landing (service_role,
-- valida el negocio a partir del JWT verificado) — no hay ningun
-- .from('landing_pages').insert/update/delete en todo src/. La unica lectura
-- directa con anon key es el SELECT publico (useLandingData.ts, ya scopeado
-- por status='published'), que esta migracion no toca.
-- ============================================================================

DROP POLICY IF EXISTS "Anon insert landing_pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Anon update landing_pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Anon delete landing_pages" ON public.landing_pages;

-- La policy "Service role manages landing_pages" (FOR ALL TO service_role)
-- ya existe desde 20260722000000_branding_bucket_fix.sql y cubre estas
-- tres operaciones para admin-manage-landing.
