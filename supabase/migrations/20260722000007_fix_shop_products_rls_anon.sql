-- Fix shop RLS: allow anon (frontend) to manage
-- The admin panel uses the anon key (no Supabase Auth session),
-- so direct writes need anon-level policies.
-- These policies were dropped in 20260718090000_security_fixes.sql
-- but never recreated for the anon role.

-- shop_products: allow anon full access
CREATE POLICY "Anon manage shop_products" ON shop_products FOR ALL
  USING (true) WITH CHECK (true);

-- shop_categories: allow anon full access
CREATE POLICY "Anon manage shop_categories" ON shop_categories FOR ALL
  USING (true) WITH CHECK (true);

-- shop_orders: allow anon full access (admin deletes orders)
CREATE POLICY "Anon manage shop_orders" ON shop_orders FOR ALL
  USING (true) WITH CHECK (true);

-- shop_order_items: allow anon full access (admin deletes order items)
CREATE POLICY "Anon manage shop_order_items" ON shop_order_items FOR ALL
  USING (true) WITH CHECK (true);
