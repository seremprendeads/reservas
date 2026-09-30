-- ============================================================================
-- FIX: el checkout publico de la tienda no podia crear pedidos (42501)
--
-- Sintoma: en /shop, al pagar, el navegador muestra "Error creating order" y la
-- consola devuelve
--   POST /rest/v1/shop_orders  ->  401
--   {"code":"42501","message":"new row violates row-level security policy
--    for table \"shop_orders\""}
-- (PostgREST reporta el rechazo de RLS como 401, no como 403.)
--
-- Causa: la policy "Anon insert shop_orders" que crea la migracion
-- 20260921060000_lock_down_shop_writes.sql NO esta viva en la base. El
-- privilegio de tabla SI existe (has_table_privilege('anon','shop_orders',
-- 'INSERT') = true), pero con RLS activo y sin policy de INSERT, Postgres
-- deniega todo. Por eso ningun pedido publico se podia crear.
--
-- La migracion esta marcada como aplicada en schema_migrations, pero el DDL
-- real de la base no coincide con el del repo. Same clase de desincronizacion
-- que se vio en las Edge Functions.
--
-- Esta migracion es idempotente: hace DROP ... IF EXISTS de las dos policies
-- (la vieja "FOR ALL" y la de INSERT) y las vuelve a crear con el mismo
-- criterio de la migracion original.
--
-- El alcance NO cambia respecto de lo ya revisado: la unica escritura anon
-- legitima es el checkout publico (ShopPage.tsx), que solo crea pedidos
-- nuevos. Confirmar el pago sigue siendo trabajo exclusivo de
-- create-shop-payment / mercadopago-webhook (service_role).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- shop_orders: solo INSERT, gateado por el modulo shop.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anon write shop_orders" ON public.shop_orders;
DROP POLICY IF EXISTS "Anon insert shop_orders" ON public.shop_orders;

CREATE POLICY "Anon insert shop_orders" ON public.shop_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
  );

-- ---------------------------------------------------------------------------
-- shop_order_items: solo INSERT, y unicamente sobre un pedido propio recien
-- creado de un negocio activo con el modulo shop.
--
-- IMPORTANTE: esta policy NO puede consultar shop_orders con un JOIN directo.
-- RLS tambien se aplica a las subconsultas dentro de una policy, y shop_orders
-- no tiene policy de SELECT para anon (a proposito). Un EXISTS contra
-- shop_orders daba falso siempre y el checkout fallaba con 42501 en el paso de
-- los items, aunque la policy pareciese correcta.
--
-- Por eso la pertenencia del pedido se resuelve con una funcion SECURITY
-- DEFINER: asi si lee shop_orders. Solo lee, y tiene search_path fijo.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_belongs_to_business(p_order_id uuid, p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_orders o
    WHERE o.id = p_order_id
      AND o.business_id = p_business_id
  );
$$;

DROP POLICY IF EXISTS "Anon write shop_order_items" ON public.shop_order_items;
DROP POLICY IF EXISTS "Anon insert shop_order_items" ON public.shop_order_items;

CREATE POLICY "Anon insert shop_order_items" ON public.shop_order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
    AND public.order_belongs_to_business(order_id, business_id)
  );
