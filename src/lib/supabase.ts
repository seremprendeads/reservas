import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// MULTI-TENANT TYPES
// ============================================================================

export type Business = {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  logo_url: string | null;
  is_active: boolean;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// BOOKING TYPES
// ============================================================================

export type Booking = {
  id: string;
  business_id: string;
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
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySetting = {
  id: string;
  business_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

export type BlockedDate = {
  id: string;
  business_id: string;
  date: string;
  reason: string | null;
};

export type Service = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_minutes: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Settings = {
  id: string;
  business_id: string;
  price: number;
  currency: string;
  slot_duration_minutes: number;
};

export type Branding = {
  id: string;
  business_id: string;
  logo_url: string;
  title: string;
  subtitle: string;
  primary_color: string;
  background_color: string;
  card_bg_color: string;
  text_color: string;
  muted_color: string;
  caption_color: string;
  background_image_url: string;
  bg_opacity: number;
  overlay_color: string;
  header_color: string;
  header_opacity: number;
  updated_at: string;
};

// ============================================================================
// WAITING LIST TYPES
// ============================================================================

export type WaitingListItem = {
  id: string;
  business_id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha_deseada: string;
  horario_deseado: string | null;
  servicio: string | null;
  estado: 'pendiente' | 'contactado' | 'convertido' | 'cancelado';
  notas: string | null;
  created_at: string;
  updated_at: string;
};
