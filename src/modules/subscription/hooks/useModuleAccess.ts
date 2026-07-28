import { useMemo } from 'react';
import { useBusiness } from '../../../contexts/BusinessContext';
import { useSubscription } from './useSubscription';
import type { ModuleId } from '../types';

interface UseModuleAccessResult {
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  enabledModules: ModuleId[];
  isFreePlan: boolean;
  isTrial: boolean;
  plan: string;
}

export function useModuleAccess(): UseModuleAccessResult {
  const { business } = useBusiness();
  const { subscription } = useSubscription({ business });

  const isFreePlan = useMemo(() => {
    if (subscription.plan !== 'free') return false;
    if (!business?.is_trial) return true;
    if (business.trial_ends_at && new Date(business.trial_ends_at).getTime() <= Date.now()) return true;
    return false;
  }, [subscription.plan, business?.is_trial, business?.trial_ends_at]);

  const isTrial = useMemo(() => {
    return business?.is_trial || false;
  }, [business?.is_trial]);

  const isModuleEnabled = useMemo(() => {
    return (moduleId: ModuleId) => subscription.enabledModules.includes(moduleId);
  }, [subscription.enabledModules]);

  return {
    isModuleEnabled,
    enabledModules: subscription.enabledModules,
    isFreePlan,
    isTrial,
    plan: subscription.plan,
  };
}
