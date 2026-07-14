-- Shop Module: product catalog, categories, orders, inventory

-- Categories
CREATE TABLE IF NOT EXISTS shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shop_categories" ON shop_categories FOR SELECT USING (true);
CREATE POLICY "Admin all shop_categories" ON shop_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);

-- Products
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  stock INT NOT NULL DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shop_products" ON shop_products FOR SELECT USING (is_active = true);
CREATE POLICY "Admin read shop_products" ON shop_products FOR SELECT USING (true);
CREATE POLICY "Admin insert shop_products" ON shop_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update shop_products" ON shop_products FOR UPDATE USING (true);
CREATE POLICY "Admin delete shop_products" ON shop_products FOR DELETE USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  payment_id TEXT,
  preference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all shop_orders" ON shop_orders FOR ALL USING (true);

-- Order items
CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS'
);

ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all shop_order_items" ON shop_order_items FOR ALL USING (true);

-- Inventory movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment')),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all inventory_movements" ON inventory_movements FOR ALL USING (true);

-- Function: decrement stock safely
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT, p_reference TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock INTO current_stock FROM shop_products WHERE id = p_product_id FOR UPDATE;
  IF current_stock IS NULL THEN
    RETURN FALSE;
  END IF;
  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  UPDATE shop_products SET stock = stock - p_quantity WHERE id = p_product_id;
  INSERT INTO inventory_movements (product_id, quantity, type, reference)
  VALUES (p_product_id, -p_quantity, 'sale', p_reference);
  RETURN TRUE;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_payment ON shop_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
