-- ============================================================================
-- TIENDA: limite de productos personalizable por negocio
--
-- Hoy el limite (12 productos activos) es un valor fijo en el frontend
-- (PLAN_LIMITS.products en src/modules/shop/config.ts), igual para todos.
-- Esto agrega una columna opcional para poder venderle a un negocio puntual
-- un limite mas alto (o ilimitado) como extra pago, sin tocar el limite
-- general de los demas.
--
-- NULL = usa el limite del plan (12). Un numero = ese negocio tiene ese
-- limite en particular, sin importar su plan.
-- ============================================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS product_limit INTEGER;

COMMENT ON COLUMN businesses.product_limit IS
  'Limite de productos activos personalizado para este negocio (extra pago). NULL = usa el limite general del plan.';
