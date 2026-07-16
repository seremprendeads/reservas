-- ============================================================
-- MIGRATION: Landing Pages + AI Credits System
-- Fecha: 2026-07-20
-- ============================================================

-- Tabla de Landing Pages
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id, slug)
);

CREATE INDEX idx_landing_pages_business ON landing_pages(business_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);

-- Tabla de Créditos IA
CREATE TABLE IF NOT EXISTS ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  credits_total INT NOT NULL DEFAULT 15,
  credits_used INT NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_credits_business ON ai_credits(business_id);

-- Tabla de Historial de Uso IA
CREATE TABLE IF NOT EXISTS ai_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  credits_cost INT NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_business ON ai_usage_history(business_id);
CREATE INDEX idx_ai_usage_created ON ai_usage_history(created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_history ENABLE ROW LEVEL SECURITY;

-- landing_pages: owner can CRUD their own, public can read published
CREATE POLICY "Owner can manage own landing pages"
  ON landing_pages FOR ALL
  USING (business_id = (SELECT business_id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Public can read published landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'published');

-- ai_credits: owner can read their own
CREATE POLICY "Owner can read own AI credits"
  ON ai_credits FOR SELECT
  USING (business_id = (SELECT business_id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Service role can manage AI credits"
  ON ai_credits FOR ALL
  USING (true);

-- ai_usage_history: owner can read their own
CREATE POLICY "Owner can read own AI usage history"
  ON ai_usage_history FOR SELECT
  USING (business_id = (SELECT business_id FROM admin_users WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Service role can insert AI usage history"
  ON ai_usage_history FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Function: Create default AI credits for new businesses
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_ai_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_credits (business_id, credits_total, credits_used)
  VALUES (NEW.id, 15, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_created_ai_credits
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_ai_credits();

-- ============================================================
-- Function: Consume AI credits (atomic)
-- ============================================================

CREATE OR REPLACE FUNCTION consume_ai_credits(
  p_business_id UUID,
  p_credits_needed INT,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_credits_remaining INT;
  v_new_used INT;
BEGIN
  -- Get current credits
  SELECT credits_used INTO v_new_used
  FROM ai_credits
  WHERE business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credits account found');
  END IF;

  -- Check if enough credits
  SELECT credits_total - credits_used INTO v_credits_remaining
  FROM ai_credits
  WHERE business_id = p_business_id;

  IF v_credits_remaining < p_credits_needed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not enough credits',
      'credits_remaining', v_credits_remaining,
      'credits_needed', p_credits_needed
    );
  END IF;

  -- Consume credits
  UPDATE ai_credits
  SET credits_used = credits_used + p_credits_needed
  WHERE business_id = p_business_id;

  -- Record usage
  INSERT INTO ai_usage_history (business_id, action, credits_cost, metadata)
  VALUES (p_business_id, p_action, p_credits_needed, p_metadata);

  -- Return new balance
  SELECT credits_total - credits_used INTO v_credits_remaining
  FROM ai_credits
  WHERE business_id = p_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_credits_remaining,
    'credits_cost', p_credits_needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Seed: Create AI credits for existing businesses
-- ============================================================

INSERT INTO ai_credits (business_id, credits_total, credits_used)
SELECT id, 15, 0
FROM businesses
WHERE id NOT IN (SELECT business_id FROM ai_credits)
ON CONFLICT (business_id) DO NOTHING;
