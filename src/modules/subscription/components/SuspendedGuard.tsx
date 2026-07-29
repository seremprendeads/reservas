import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase, type Business } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { SuspendedScreen } from './SuspendedScreen';
import { DEFAULT_SUBSCRIPTION_CONFIG } from '../lib/constants';

interface SuspendedGuardProps {
  children: React.ReactNode;
}

function getTrialEnd(business: Business): Date | null {
  if (!business.is_trial) return null;
  if (DEFAULT_SUBSCRIPTION_CONFIG.trial_duration_minutes > 0 && business.created_at) {
    const end = new Date(business.created_at);
    end.setMinutes(end.getMinutes() + DEFAULT_SUBSCRIPTION_CONFIG.trial_duration_minutes);
    return end;
  }
  if (!business.trial_ends_at) return null;
  return new Date(business.trial_ends_at);
}

function isBusinessBlocked(business: Business): boolean {
  if (!business.is_active) return true;
  if (business.is_trial) {
    const trialEnd = getTrialEnd(business);
    if (!trialEnd) return false;
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 0 && DEFAULT_SUBSCRIPTION_CONFIG.read_only_when_cancelled) return true;
  }
  return false;
}

export function SuspendedGuard({ children }: SuspendedGuardProps) {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { business: contextBusiness } = useBusiness();
  const slug = urlSlug || contextBusiness?.slug;

  const [state, setState] = useState<{
    checking: boolean;
    suspended: boolean;
    message: string;
    supportWhatsapp: string;
    supportEmail: string;
    paymentButtonUrl: string;
  }>({
    checking: false,
    suspended: false,
    message: DEFAULT_SUBSCRIPTION_CONFIG.suspended_message,
    supportWhatsapp: DEFAULT_SUBSCRIPTION_CONFIG.support_whatsapp,
    supportEmail: DEFAULT_SUBSCRIPTION_CONFIG.support_email,
    paymentButtonUrl: DEFAULT_SUBSCRIPTION_CONFIG.payment_button_url,
  });

  useEffect(() => {
    if (!slug) {
      setState(prev => ({ ...prev, checking: false, suspended: false }));
      return;
    }

    if (contextBusiness) {
      setState(prev => ({
        ...prev,
        checking: false,
        suspended: isBusinessBlocked(contextBusiness),
      }));
      return;
    }

    setState(prev => ({ ...prev, checking: true }));

    supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const biz = data as unknown as Business;
          setState(prev => ({
            ...prev,
            checking: false,
            suspended: isBusinessBlocked(biz),
          }));
        } else {
          setState(prev => ({ ...prev, checking: false, suspended: false }));
        }
      })
      .catch(() => {
        setState(prev => ({ ...prev, checking: false, suspended: false }));
      });
  }, [slug, contextBusiness]);

  if (state.checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.suspended) {
    return (
      <SuspendedScreen
        message={state.message}
        supportWhatsapp={state.supportWhatsapp || undefined}
        supportEmail={state.supportEmail || undefined}
        paymentButtonUrl={state.paymentButtonUrl || undefined}
      />
    );
  }

  return <>{children}</>;
}
