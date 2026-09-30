-- La policy anterior fallaba porque consultaba shop_orders desde adentro.
-- RLS tambien se aplica a las subconsultas de una policy: como shop_orders
-- no tiene policy de SELECT para anon, el EXISTS daba falso siempre.
--
-- Esta version resuelve la pertenencia del pedido con una funcion
-- SECURITY DEFINER, que si lee shop_orders (saltandose RLS a proposito y solo
-- para leer). El resto de las condiciones se evaluan con RLS normal.

-- 1) Funcion auxiliar: el pedido existe y es de ESTE negocio.
--    DROP primero porque si existe con otro cuerpo, CREATE OR REPLACE
--    complains si cambia el tipo de retorno.
DROP FUNCTION IF EXISTS public.order_belongs_to_business(uuid, uuid);

CREATE FUNCTION public.order_belongs_to_business(p_order_id uuid, p_business_id uuid)
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

-- 2) Policy correcta: el item tiene que pertenecer a un pedido del mismo
--    negocio, y ese negocio tiene que tenerShop.
DROP POLICY IF EXISTS "Anon insert shop_order_items" ON public.shop_order_items;

CREATE POLICY "Anon insert shop_order_items" ON public.shop_order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    business_id IS NOT NULL
    AND public.business_has_module(business_id, 'shop')
    AND public.order_belongs_to_business(order_id, business_id)
  );

-- Verificacion
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'shop_order_items';
