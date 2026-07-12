ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_shop_products_deleted_at ON shop_products(deleted_at) WHERE deleted_at IS NOT NULL;
