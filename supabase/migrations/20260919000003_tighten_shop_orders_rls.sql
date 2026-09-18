-- ============================================================================
-- TIENDA: sacar el permiso de editar/borrar pedidos por la clave anon
--
-- Contexto: la política "Anon write shop_orders" / "Anon write
-- shop_order_items" (creadas en 20260822000000_fix_anon_write_rls.sql) dan
-- FOR ALL (select/insert/update/delete) a cualquiera con la clave anon,
-- validando solo que el negocio exista y esté activo — sin verificar que
-- quien pide el cambio sea el dueño de ese pedido.
--
-- Verificado en el código actual (src/modules/shop):
--   - ShopPage.tsx (checkout público): solo hace INSERT en shop_orders y
--     shop_order_items, y SELECT de shop_orders (para sondear el estado del
--     pago). Nunca actualiza ni borra.
--   - ShopAdmin.tsx (panel de administración): no tiene NINGÚN acceso
--     directo a estas tablas — todas sus operaciones (incluido borrar un
--     pedido) pasan por la Edge Function admin-manage-shop (service_role).
--
-- Es decir: hoy nada de la aplicación usa el UPDATE/DELETE anon en estas
-- dos tablas. Sacarlo no rompe ningún flujo existente, y cierra la puerta
-- por la que cualquiera con la clave pública (va en el bundle del sitio)
-- podía hoy modificar o borrar pedidos reales de cualquier negocio.
--
-- Se conserva: INSERT y SELECT anon en shop_orders (necesarios para el
-- checkout público) e INSERT anon en shop_order_items (idem). Los pedidos
-- solo se pueden crear, no alterar ni eliminar, desde la clave pública.
-- ============================================================================

DROP POLICY IF EXISTS "Anon write shop_orders" ON public.shop_orders;

CREATE POLICY "Anon insert shop_orders" ON public.shop_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_id
        AND businesses.is_active = true
    )
  );

DROP POLICY IF EXISTS "Anon write shop_order_items" ON public.shop_order_items;

CREATE POLICY "Anon insert shop_order_items" ON public.shop_order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders
      JOIN businesses ON businesses.id = shop_orders.business_id
      WHERE shop_orders.id = order_id
        AND businesses.is_active = true
    )
  );

-- "Anon read shop_orders" (SELECT, de 20260822000000) y las políticas
-- service_role de ambas tablas no se tocan: siguen igual que antes.
