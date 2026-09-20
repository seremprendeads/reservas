-- ============================================================================
-- CRITICO: shop_orders se podia marcar "pagado" directo con la anon key
--
-- "Anon write shop_orders" era FOR ALL (insert+update+delete) con solo un
-- chequeo de "el negocio existe y esta activo" — cualquiera podia hacer
--   PATCH /rest/v1/shop_orders?id=eq.<cualquier-id>  { payment_status: 'approved' }
-- y marcar CUALQUIER pedido de CUALQUIER negocio como pagado sin pagar nada,
-- o borrar pedidos ajenos. Mismo problema en shop_order_items (podian
-- reescribirse los items/precios de un pedido ya creado).
--
-- Ademas, tanto shop_products como shop_categories tenian policies de
-- escritura anon "FOR ALL" que ya no usa nadie: el panel de Tienda
-- (ShopAdmin.tsx) escribe exclusivamente via la Edge Function
-- admin-manage-shop (que se agrega en este mismo paquete de cambios,
-- usando service_role) — no hay un solo .from('shop_products'|'shop_categories')
-- de escritura en todo el frontend.
--
-- El UNICO caso legitimo de escritura anon es el checkout publico
-- (ShopPage.tsx): crear un pedido nuevo (INSERT) y sus items (INSERT), nunca
-- modificarlos despues. Confirmar el pago pasa a ser trabajo exclusivo de
-- create-shop-payment / mercadopago-webhook (service_role).
-- ============================================================================

-- 1. shop_products: la escritura anon (gateada por modulo) ya no la usa
--    nadie — todo pasa por admin-manage-shop.
DROP POLICY IF EXISTS "Anon write shop_products" ON public.shop_products;

-- 2. shop_categories: idem, la escritura anon quedo sin uso.
DROP POLICY IF EXISTS "Anon write shop_categories" ON shop_categories;

-- 3. shop_orders: de "FOR ALL" (insert/update/delete) a solo INSERT, y
--    gateado ademas por el modulo shop (igual que shop_products).
DROP POLICY IF EXISTS "Anon write shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Anon insert shop_orders" ON shop_orders;
CREATE POLICY "Anon insert shop_orders" ON shop_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
  );

-- 4. shop_order_items: idem, solo INSERT sobre un pedido propio recien
--    creado (via el mismo join que ya usaba la policy anterior).
DROP POLICY IF EXISTS "Anon write shop_order_items" ON shop_order_items;
DROP POLICY IF EXISTS "Anon insert shop_order_items" ON shop_order_items;
CREATE POLICY "Anon insert shop_order_items" ON shop_order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders
      JOIN businesses ON businesses.id = shop_orders.business_id
      WHERE shop_orders.id = order_id
        AND businesses.is_active = true
        AND public.business_has_module(shop_orders.business_id, 'shop')
    )
  );

-- Las policies "Service role manages shop_*" (FOR ALL TO service_role) ya
-- existen para las 4 tablas y cubren admin-manage-shop, create-shop-payment
-- y el manejo de shop_orders en mercadopago-webhook.
