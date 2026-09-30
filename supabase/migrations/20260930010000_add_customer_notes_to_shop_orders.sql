-- Detalle del pedido escrito por el comprador en el formulario final de la
-- tienda (talle, medida o presentacion: "talle M", "2 kilos", "6 botellas").
-- Es obligatorio: sin esto no se sabe que se lleva el pedido.
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS customer_notes TEXT;
