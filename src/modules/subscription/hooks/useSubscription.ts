import { useMemo } from 'react';
import type { Business } from '../../../../lib/supabase';
import type { SubscriptionInfo, SubscriptionConfig, SubscriptionStatus } from '../types';
import { DEFAULT_SUBSCRIPTION_CONFIG, getEnabledModules } from '../lib/constants';

interface UseSubscriptionOptions {
  business: Business | null;
  config?: Partial<SubscriptionConfig>;
}

interface UseSubscriptionResult {
  subscription: SubscriptionInfo;
  config: SubscriptionConfig;
}

function deriveStatus(business: Business | null, warningDays: number): SubscriptionStatus {
  if (!business) return 'active';
  if (!business.is_active) return 'suspended';
  if (business.is_trial) {
    if (!business.trial_ends_at) return 'trial';
    const daysLeft = Math.ceil(
      (new Date(business.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 0) return 'cancelled';
    if (daysLeft <= warningDays) return 'expiring';
    return 'trial';
  }
  return 'active';
}

function calcDaysUntilExpiry(business: Business | null): number | null {
  if (!business?.trial_ends_at) return null;
  return Math.max(
    0,
    Math.ceil(
      (new Date(business.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
}

export function useSubscription({ business, config: configOverrides }: UseSubscriptionOptions): UseSubscriptionResult {
  const config = useMemo(
    () => ({ ...DEFAULT_SUBSCRIPTION_CONFIG, ...configOverrides }),
    [configOverrides]
  );

  const subscription = useMemo<SubscriptionInfo>(() => {
    const status = deriveStatus(business, config.days_before_expiry_warning);
    const daysUntilExpiry = calcDaysUntilExpiry(business);
    const isBlocked =
      status === 'suspended' ||
      (status === 'cancelled' && config.read_only_when_cancelled);

    const enabledModules = getEnabledModules(
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
