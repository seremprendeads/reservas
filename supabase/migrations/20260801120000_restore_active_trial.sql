-- Restore active trial and remove suspension for all businesses
UPDATE businesses 
SET is_active = true,
    is_trial = true, 
    trial_ends_at = now() + interval '14 days';
