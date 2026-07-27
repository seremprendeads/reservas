-- Fix: exclude soft-deleted products from public store read
DROP POLICY IF EXISTS "Public read active shop_products" ON shop_products;

CREATE POLICY "Public read active shop_products" ON shop_products FOR SELECT
  USING (is_active = true AND deleted_at IS NULL);
