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

// Duración del trial para la beta de prospección directa.
// El backend (Edge Functions) es la fuente de verdad para este valor.
// El frontend lo usa solo para UI informativa — nunca para decisiones de acceso.
export const TRIAL_DAYS = 18;

export type Business = {
  id: string;
  name: string;
  slug: string;
  // owner_email NO se incluye: no lo expone la vista public_businesses ni debe llegar al cliente
  logo_url: string | null;
  is_active: boolean;
  // Campos sensibles: opcionales porque la vista pública no los expone.
  // Solo se populan cuando se carga el negocio post-login (admin panel).
  plan?: string;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  timezone: string;
  currency: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
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
  deleted_at?: string;
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

export type ShopBannerConfig = {
  enabled: boolean;
  text: string;
  button_text: string;
  button_url: string;
  end_date: string;
  gradient_from: string;
  gradient_to: string;
  text_color: string;
};

export type ShopPopupConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_url: string;
  image_url: string;
  overlay_color: string;
};

export type ShopSocialEntry = {
  id: string;
  name: string;
  product: string;
  location: string;
  time_ago: string;
};

export type ShopSocialConfig = {
  enabled: boolean;
  entries: ShopSocialEntry[];
  interval_seconds: number;
};

export type ShopConfig = {
  banner: ShopBannerConfig | null;
  popup: ShopPopupConfig | null;
  social: ShopSocialConfig | null;
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
  shop_config: ShopConfig | null;
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

// ============================================================================
// LANDING PAGE TYPES
// ============================================================================

export type LandingPage = {
  id: string;
  business_id: string;
  slug: string;
  template: string;
  sections: Record<string, unknown>;
  theme: Record<string, unknown>;
  status: 'draft' | 'published';
  visible_sections: string[];
  logo_url: string | null;
  seo: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
