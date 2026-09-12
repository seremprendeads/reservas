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

  // Prueba vencida: la cuenta queda en Free aunque tenga otro plan guardado.
  const trialExpired = useMemo(() => {
    if (!business?.is_trial) return false;
    return !!business.trial_ends_at && new Date(business.trial_ends_at).getTime() <= Date.now();
  }, [business?.is_trial, business?.trial_ends_at]);

  const isFreePlan = useMemo(() => {
    if (trialExpired) return true;
    if (business?.is_trial) return false;
    return subscription.plan === 'free';
  }, [subscription.plan, business?.is_trial, trialExpired]);

  const isTrial = useMemo(() => {
    return (business?.is_trial || false) && !trialExpired;
  }, [business?.is_trial, trialExpired]);

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
