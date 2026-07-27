-- Add sizes column to shop_products for apparel/footwear products
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS sizes JSONB NOT NULL DEFAULT '[]';

-- Add selected_size column to order items
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS selected_size TEXT;
