-- ============================================================
-- Add 'beta' to plan CHECK constraint
-- ============================================================

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_plan_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
  CHECK (plan IN ('free', 'beta', 'starter', 'pro', 'enterprise'));

-- ============================================================
-- Function: Reset AI credits when plan changes
-- Called when a business upgrades/pays for a plan
-- ============================================================

CREATE OR REPLACE FUNCTION reset_ai_credits_for_plan(
  p_business_id UUID,
  p_new_plan TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_new_total INT;
  v_old_total INT;
  v_old_used INT;
BEGIN
  -- Map plan to credits
  CASE p_new_plan
    WHEN 'free' THEN v_new_total := 0;
    WHEN 'beta' THEN v_new_total := 15;
    WHEN 'starter' THEN v_new_total := 10;
    WHEN 'pro' THEN v_new_total := 15;
    WHEN 'enterprise' THEN v_new_total := 50;
    ELSE v_new_total := 15; -- default fallback
  END CASE;

  -- Get current credits
  SELECT credits_total, credits_used
  INTO v_old_total, v_old_used
  FROM ai_credits
  WHERE business_id = p_business_id;

  -- Update plan on businesses table
  UPDATE businesses
  SET plan = p_new_plan,
      is_trial = false,
      updated_at = now()
  WHERE id = p_business_id;

  -- Reset credits: new total, 0 used
  INSERT INTO ai_credits (business_id, credits_total, credits_used)
  VALUES (p_business_id, v_new_total, 0)
  ON CONFLICT (business_id) DO UPDATE
  SET credits_total = v_new_total,
      credits_used = 0,
      updated_at = now();

  -- Record the reset in usage history
  INSERT INTO ai_usage_history (business_id, action, credits_cost, metadata)
  VALUES (
    p_business_id,
    'plan_upgrade',
    0,
    jsonb_build_object(
      'new_plan', p_new_plan,
      'new_credits_total', v_new_total,
      'old_credits_total', v_old_total,
      'old_credits_used', v_old_used
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_plan', p_new_plan,
    'credits_total', v_new_total,
    'credits_used', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: Auto-reset credits when plan column changes
-- ============================================================

CREATE OR REPLACE FUNCTION on_plan_change_reset_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_new_total INT;
BEGIN
  -- Only run if plan actually changed
  IF OLD.plan = NEW.plan THEN
    RETURN NEW;
  END IF;

  -- Map plan to credits
  CASE NEW.plan
    WHEN 'free' THEN v_new_total := 0;
    WHEN 'beta' THEN v_new_total := 15;
    WHEN 'starter' THEN v_new_total := 10;
    WHEN 'pro' THEN v_new_total := 15;
    WHEN 'enterprise' THEN v_new_total := 50;
    ELSE v_new_total := 15;
  END CASE;

  -- Reset credits
  INSERT INTO ai_credits (business_id, credits_total, credits_used)
  VALUES (NEW.id, v_new_total, 0)
  ON CONFLICT (business_id) DO UPDATE
  SET credits_total = v_new_total,
      credits_used = 0,
      updated_at = now();

  -- Record usage
  INSERT INTO ai_usage_history (business_id, action, credits_cost, metadata)
  VALUES (
    NEW.id,
    'plan_change',
    0,
    jsonb_build_object(
      'old_plan', OLD.plan,
      'new_plan', NEW.plan,
      'credits_total', v_new_total
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then create
DROP TRIGGER IF EXISTS on_business_plan_change ON businesses;
CREATE TRIGGER on_business_plan_change
  AFTER UPDATE OF plan ON businesses
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION on_plan_change_reset_credits();
