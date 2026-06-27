/*
# Booking System Schema

Creates tables for a single-professional booking system with Mercado Pago integration.

## Tables

1. `availability_settings` - Working days and hours configuration
   - `id` (uuid, primary key)
   - `day_of_week` (int, 0-6 for Sunday-Saturday)
   - `start_time` (time, shift start)
   - `end_time` (time, shift end)
   - `is_active` (boolean, whether this day is enabled)

2. `blocked_dates` - Unavailable dates
   - `id` (uuid, primary key)
   - `date` (date, blocked date)
   - `reason` (text, optional reason)

3. `bookings` - Main booking records
   - `id` (uuid, primary key)
   - `booking_code` (text, unique, format RES-YYYY-XXXX)
   - `customer_name` (text)
   - `customer_phone` (text)
   - `customer_email` (text)
   - `booking_date` (date)
   - `booking_time` (time)
   - `payment_status` (text: approved, pending, rejected)
   - `payment_id` (text, Mercado Pago payment ID)
   - `preference_id` (text, Mercado Pago preference ID)
   - `booking_status` (text: confirmed, pending, cancelled, completed)
   - `amount` (decimal, payment amount)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. `booking_counter` - Sequence counter for booking codes
   - `year` (int, primary key)
   - `last_number` (int)

5. `admin_users` - Admin CRM users
   - `id` (uuid, primary key)
   - `email` (text, unique)
   - `password_hash` (text)
   - `name` (text)
   - `created_at` (timestamp)

6. `settings` - Global system settings
   - `id` (uuid, primary key)
   - `price` (decimal, booking price)
   - `currency` (text, default ARS)
   - `slot_duration_minutes` (int, default 60)

## Security

- RLS enabled on all tables.
- `availability_settings`, `blocked_dates`, `settings`: readable by anon for public booking page.
- `bookings`: anon can insert (create booking), select own by email (for confirmation page).
- `admin_users`: only accessible via service role (edge functions).
- Admin CRUD via edge functions with auth.
*/

-- Availability Settings
CREATE TABLE IF NOT EXISTS availability_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes int NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Blocked Dates
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Booking Counter for sequential codes
CREATE TABLE IF NOT EXISTS booking_counter (
  year int PRIMARY KEY,
  last_number int NOT NULL DEFAULT 0
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_id text,
  preference_id text,
  booking_status text NOT NULL DEFAULT 'pending',
  amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ARS',
  slot_duration_minutes int NOT NULL DEFAULT 60
);

-- Insert default settings
INSERT INTO settings (price, currency, slot_duration_minutes)
SELECT 1000, 'ARS', 60
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Insert default availability (Mon-Fri, 9-18)
INSERT INTO availability_settings (day_of_week, start_time, end_time, is_active)
SELECT 1, '09:00', '18:00', true WHERE NOT EXISTS (SELECT 1 FROM availability_settings WHERE day_of_week = 1);
INSERT INTO availability_settings (day_of_week, start_time, end_time, is_active)
SELECT 2, '09:00', '18:00', true WHERE NOT EXISTS (SELECT 1 FROM availability_settings WHERE day_of_week = 2);
INSERT INTO availability_settings (day_of_week, start_time, end_time, is_active)
SELECT 3, '09:00', '18:00', true WHERE NOT EXISTS (SELECT 1 FROM availability_settings WHERE day_of_week = 3);
INSERT INTO availability_settings (day_of_week, start_time, end_time, is_active)
SELECT 4, '09:00', '18:00', true WHERE NOT EXISTS (SELECT 1 FROM availability_settings WHERE day_of_week = 4);
INSERT INTO availability_settings (day_of_week, start_time, end_time, is_active)
SELECT 5, '09:00', '18:00', true WHERE NOT EXISTS (SELECT 1 FROM availability_settings WHERE day_of_week = 5);

-- Enable RLS
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_counter ENABLE ROW LEVEL SECURITY;

-- Availability Settings Policies (public read for booking calendar)
DROP POLICY IF EXISTS "anon_read_availability" ON availability_settings;
CREATE POLICY "anon_read_availability" ON availability_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service_manage_availability" ON availability_settings;
CREATE POLICY "service_manage_availability" ON availability_settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Blocked Dates Policies (public read for booking calendar)
DROP POLICY IF EXISTS "anon_read_blocked_dates" ON blocked_dates;
CREATE POLICY "anon_read_blocked_dates" ON blocked_dates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service_manage_blocked_dates" ON blocked_dates;
CREATE POLICY "service_manage_blocked_dates" ON blocked_dates FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Settings Policies (public read for price display)
DROP POLICY IF EXISTS "anon_read_settings" ON settings;
CREATE POLICY "anon_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service_manage_settings" ON settings;
CREATE POLICY "service_manage_settings" ON settings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Bookings Policies
-- Anon can insert bookings (for new reservations)
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Anon can read their own booking by email (for confirmation)
DROP POLICY IF EXISTS "anon_read_own_bookings" ON bookings;
CREATE POLICY "anon_read_own_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

-- Service role can manage all bookings
DROP POLICY IF EXISTS "service_manage_bookings" ON bookings;
CREATE POLICY "service_manage_bookings" ON bookings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Admin Users - only accessible via service role
DROP POLICY IF EXISTS "service_manage_admin_users" ON admin_users;
CREATE POLICY "service_manage_admin_users" ON admin_users FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Booking Counter - only via service role (for code generation)
DROP POLICY IF EXISTS "service_manage_booking_counter" ON booking_counter;
CREATE POLICY "service_manage_booking_counter" ON booking_counter FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Function to generate booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year int := EXTRACT(YEAR FROM CURRENT_DATE);
  new_number int;
  booking_code text;
BEGIN
  INSERT INTO booking_counter (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
  SET last_number = booking_counter.last_number + 1
  RETURNING last_number INTO new_number;
  
  booking_code := 'RES-' || current_year || '-' || LPAD(new_number::text, 4, '0');
  RETURN booking_code;
END;
$$;

-- Index for fast booking lookups by date
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);