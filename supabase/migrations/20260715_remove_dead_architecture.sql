-- Migration: Remove dead architecture (roles, team, invites, feature flags, AI credits)
-- This migration drops tables and columns that are no longer needed.
-- 1 user = 1 business = 1 panel. No roles, no team, no invites.

-- Drop tables completely
DROP TABLE IF EXISTS business_members CASCADE;
DROP TABLE IF EXISTS invite_tokens CASCADE;
DROP TABLE IF EXISTS ai_credits CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Drop the has_business_role function (never called)
DROP FUNCTION IF EXISTS has_business_role(UUID, TEXT, TEXT);

-- Remove dead columns from businesses
ALTER TABLE businesses DROP COLUMN IF EXISTS domain;
ALTER TABLE businesses DROP COLUMN IF EXISTS language;

-- Make business_id NOT NULL on admin_users
-- First, update any admin without a business to point to the first active business
DO $$
DECLARE
  default_biz_id UUID;
BEGIN
  SELECT id INTO default_biz_id FROM businesses WHERE is_active = true ORDER BY created_at LIMIT 1;
  
  IF default_biz_id IS NOT NULL THEN
    UPDATE admin_users SET business_id = default_biz_id WHERE business_id IS NULL;
  END IF;
END $$;

ALTER TABLE admin_users ALTER COLUMN business_id SET NOT NULL;
