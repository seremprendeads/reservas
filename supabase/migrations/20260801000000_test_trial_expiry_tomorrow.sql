-- Set trial_ends_at to tomorrow at 09:00 AM for testing trial expiration & suspension
UPDATE businesses 
SET is_trial = true, 
    trial_ends_at = (now() + interval '1 day')::date + interval '9 hours' 
WHERE trial_ends_at IS NULL OR trial_ends_at > now();
