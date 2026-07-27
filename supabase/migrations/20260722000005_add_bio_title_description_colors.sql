-- Add title and description color fields to bio_profiles

ALTER TABLE bio_profiles
  ADD COLUMN IF NOT EXISTS title_color TEXT,
  ADD COLUMN IF NOT EXISTS description_color TEXT;
