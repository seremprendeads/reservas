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
    return subscription.plan === 'free' && !business?.is_trial;
  }, [subscription.plan, business?.is_trial]);

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
