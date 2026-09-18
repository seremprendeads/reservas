-- ============================================================================
-- TIENDA Y SITIO WEB: cerrar la escritura anónima en shop_products,
-- shop_categories y landing_pages (bloqueante 1, cierre completo)
--
-- Contexto: el panel de administración de tienda y de sitio web ya migraron
-- a Edge Functions con service_role (admin-manage-shop, admin-manage-landing
-- — confirmado funcionando en producción por el dueño el 18/9/2026: guardó
-- un producto con imagen nueva y un cambio en el sitio, ambos OK). Se
-- verificó además, con un grep de todo src/, que NINGÚN archivo del
-- frontend hace ya un acceso directo de escritura a estas tres tablas — los
-- únicos accesos que quedan son 3 lecturas públicas (storefront y landing
-- pública), que esta migración no toca.
--
-- Las políticas "Anon write shop_products", "Anon write shop_categories" y
-- las de insert/update/delete de landing_pages (creadas en
-- 20260822000000_fix_anon_write_rls.sql y ajustadas en
-- 20260912000000_plan_module_rls.sql) validaban solo "el negocio existe,
-- está activo y tiene el módulo" — nunca quién hacía el pedido. Cualquiera
-- con la clave anon (pública, va en el bundle del sitio) y el business_id
-- de un negocio ajeno podía editar/borrar sus productos, categorías o su
-- sitio web. Como esas puertas ya no las usa nadie de la aplicación,
-- se cierran del todo: de ahora en más solo se escriben vía service_role
-- (las Edge Functions ya usan ese cliente, que además ignora RLS por
-- diseño de Supabase, así que no dependen en nada de estas políticas).
--
-- De paso se cierra también la lectura de más de lo necesario:
--   - "Anon read all shop_products" dejaba ver productos inactivos/en
--     papelera de cualquier negocio (precio, stock, imágenes). Ya no lo usa
--     el panel (migrado a admin-manage-shop).
--   - "Anon read landing_pages" (USING true) dejaba ver los BORRADORES sin
--     publicar de cualquier negocio. Ya no lo usa el panel (migrado a
--     admin-manage-landing). Este era el hallazgo de exposición de datos
--     que la auditoría original marcó junto al bloqueante 1.
--
-- Se conserva intacta la lectura pública real:
--   - shop_products: solo activos y no borrados (storefront).
--   - shop_categories: lectura abierta (no son datos sensibles, se usan
--     para filtrar en la tienda pública).
--   - landing_pages: solo status = 'published' (página pública).
-- ============================================================================

-- shop_products: sacar escritura y lectura ampliada anónimas
DROP POLICY IF EXISTS "Anon write shop_products" ON public.shop_products;
DROP POLICY IF EXISTS "Anon read all shop_products" ON public.shop_products;
-- Se conserva "Public read active shop_products" (is_active = true AND deleted_at IS NULL) tal cual.

-- shop_categories: sacar escritura anónima
DROP POLICY IF EXISTS "Anon write shop_categories" ON public.shop_categories;
-- Se conserva "Public read shop_categories" (USING true) tal cual: son solo nombres de categoría.

-- landing_pages: sacar escritura y lectura de borradores anónimas
DROP POLICY IF EXISTS "Anon insert landing_pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Anon update landing_pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Anon delete landing_pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Anon read landing_pages" ON public.landing_pages;
-- Se conserva "Public read published landing_pages" (status = 'published') tal cual.
