import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Booking = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  booking_date: string;
  booking_time: string;
  payment_status: 'approved' | 'pending' | 'rejected';
  payment_id: string | null;
  preference_id: string | null;
  booking_status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  amount: number;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySetting = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

export type BlockedDate = {
  id: string;
  date: string;
  reason: string | null;
};

export type Settings = {
  id: string;
  price: number;
  currency: string;
  slot_duration_minutes: number;
};

export type Branding = {
  id: string;
  logo_url: string;
  title: string;
  subtitle: string;
  primary_color: string;
  background_color: string;
  card_bg_color: string;
  text_color: string;
  muted_color: string;
  background_image_url: string;
  updated_at: string;
};
