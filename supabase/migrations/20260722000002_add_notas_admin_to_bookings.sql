-- Add notas_admin column to bookings table for internal admin notes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notas_admin TEXT DEFAULT '';
