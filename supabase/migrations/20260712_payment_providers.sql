-- Payment Providers: per-business payment gateway configuration

CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'stripe', 'paypal', 'crypto')),
  access_token TEXT,
  client_id TEXT,
  client_secret TEXT,
  wallet_address TEXT,
  public_key TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected')),
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, provider)
);

ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin all payment_providers" ON payment_providers FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_providers_shop ON payment_providers(shop_id);
CREATE INDEX IF NOT EXISTS idx_payment_providers_provider ON payment_providers(provider);
