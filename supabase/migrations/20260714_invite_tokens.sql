-- ============================================================================
-- INVITE TOKENS (Pending business invitations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_business ON invite_tokens(business_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email ON invite_tokens(email);

-- Only service role can manage invite tokens
DROP POLICY IF EXISTS "Service role manages invite_tokens" ON invite_tokens;
CREATE POLICY "Service role manages invite_tokens" ON invite_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Update businesses table: make slug unique if not already
-- ============================================================================

-- Ensure slug is unique (should already be, but safety check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_unique'
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
  END IF;
END $$;
