-- Trial system: 14-day trial for new businesses

-- Add trial columns to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT true;

-- Set trial end date for existing businesses (14 days from now)
UPDATE businesses SET trial_ends_at = now() + interval '14 days', is_trial = true WHERE trial_ends_at IS NULL;

-- Set trial end date for new businesses (handled by trigger)
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + interval '14 days';
    NEW.is_trial := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_trial_end ON businesses;
CREATE TRIGGER trg_set_trial_end
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_end_date();
