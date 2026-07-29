import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { SuspendedScreen } from './SuspendedScreen';
import { DEFAULT_SUBSCRIPTION_CONFIG } from '../lib/constants';

interface SuspendedGuardProps {
  children: React.ReactNode;
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
      if (!contextBusiness.is_active) {
        setState(prev => ({ ...prev, checking: false, suspended: true }));
      } else {
        setState(prev => ({ ...prev, checking: false, suspended: false }));
      }
      return;
    }

    setState(prev => ({ ...prev, checking: true }));

    supabase
      .from('businesses')
      .select('id, is_active')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.is_active) {
          setState(prev => ({ ...prev, checking: false, suspended: true }));
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
