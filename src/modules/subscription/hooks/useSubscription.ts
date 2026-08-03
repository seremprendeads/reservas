import { useMemo } from 'react';
import type { Business } from '../../../../lib/supabase';
import type { SubscriptionInfo, SubscriptionConfig, SubscriptionStatus, ModuleId } from '../types';
import { DEFAULT_SUBSCRIPTION_CONFIG, getEnabledModules } from '../lib/constants';

interface UseSubscriptionOptions {
  business: Business | null;
  config?: Partial<SubscriptionConfig>;
}

interface UseSubscriptionResult {
  subscription: SubscriptionInfo;
  config: SubscriptionConfig;
}

function getTrialEnd(business: Business | null, trialDurationMinutes: number): Date | null {
  if (!business?.is_trial) return null;
  if (trialDurationMinutes > 0 && business.created_at) {
    const end = new Date(business.created_at);
    end.setMinutes(end.getMinutes() + trialDurationMinutes);
    return end;
  }
  if (!business.trial_ends_at) return null;
  return new Date(business.trial_ends_at);
}

function deriveStatus(business: Business | null, warningDays: number, trialDurationMinutes: number): SubscriptionStatus {
  if (!business) return 'active';
  if (!business.is_active) return 'suspended';
  if (business.is_trial) {
    const trialEnd = getTrialEnd(business, trialDurationMinutes);
    if (!trialEnd) return 'trial';
    if (trialEnd.getTime() <= Date.now()) return 'suspended';
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 0) return 'suspended';
    if (daysLeft <= warningDays) return 'expiring';
    return 'trial';
  }
  return 'active';
}

function calcDaysUntilExpiry(business: Business | null, trialDurationMinutes: number): number | null {
  const trialEnd = getTrialEnd(business, trialDurationMinutes);
  if (!trialEnd) return null;
  return Math.max(
    0,
    Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
}

export function useSubscription({ business, config: configOverrides }: UseSubscriptionOptions): UseSubscriptionResult {
  const config = useMemo(
    () => ({ ...DEFAULT_SUBSCRIPTION_CONFIG, ...configOverrides }),
    [configOverrides]
  );

  const subscription = useMemo<SubscriptionInfo>(() => {
    const status = deriveStatus(business, config.days_before_expiry_warning, config.trial_duration_minutes);
    const daysUntilExpiry = calcDaysUntilExpiry(business, config.trial_duration_minutes);
    const isBlocked =
      status === 'suspended' ||
      (status === 'cancelled' && config.read_only_when_cancelled);

    const enabledModules = status === 'suspended'
      ? ['bio' as ModuleId]
      : getEnabledModules(
          business?.plan || 'free',
          business?.is_trial || false
        );

    return {
      status,
      plan: business?.plan || 'free',
      trial_ends_at: business?.trial_ends_at || null,
      days_until_expiry: daysUntilExpiry,
      is_blocked: isBlocked,
      enabledModules,
    };
  }, [business, config]);

  return { subscription, config };
}
