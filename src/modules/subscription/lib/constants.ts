import type { SubscriptionConfig, ModuleId } from '../types';

export const DEFAULT_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
  show_trial_banner: true,
  show_expiring_popup: true,
  days_before_expiry_warning: 7,
  suspended_message: 'Tu suscripción está suspendida. Para continuar usando el sistema, renová tu plan.',
  support_whatsapp: '',
  support_email: '',
  payment_button_url: '',
  read_only_when_cancelled: false,
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  trial: 'Prueba',
  expiring: 'Por vencer',
  suspended: 'Suspendida',
  cancelled: 'Cancelada',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-600',
  trial: 'text-blue-600',
  expiring: 'text-amber-600',
  suspended: 'text-red-600',
  cancelled: 'text-gray-500',
};

export const PLAN_MODULES: Record<string, ModuleId[]> = {
  trial: ['bio', 'landing', 'reservas', 'shop', 'seo', 'landing_shop'],
  free: ['bio'],
  basic: ['bio', 'landing', 'reservas'],
  pro: ['bio', 'landing', 'reservas', 'shop'],
  enterprise: ['bio', 'landing', 'reservas', 'shop', 'seo', 'landing_shop'],
};

export const DEFAULT_PLAN = 'free';

export function getEnabledModules(plan: string, isTrial: boolean): ModuleId[] {
  if (isTrial) return PLAN_MODULES.trial;
  return PLAN_MODULES[plan] || PLAN_MODULES[DEFAULT_PLAN];
}
