export type SubscriptionStatus = 'active' | 'trial' | 'expiring' | 'suspended' | 'cancelled';

export type ModuleId =
  | 'bio'
  | 'landing'
  | 'reservas'
  | 'shop'
  | 'seo'
  | 'landing_shop';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: string;
  trial_ends_at: string | null;
  days_until_expiry: number | null;
  is_blocked: boolean;
  enabledModules: ModuleId[];
}

export interface SubscriptionConfig {
  show_trial_banner: boolean;
  show_expiring_popup: boolean;
  days_before_expiry_warning: number;
  suspended_message: string;
  support_whatsapp: string;
  support_email: string;
  payment_button_url: string;
  read_only_when_cancelled: boolean;
  trial_duration_minutes: number;
}
