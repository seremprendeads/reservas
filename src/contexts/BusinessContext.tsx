import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Business, FeatureFlag, supabase, FEATURE_KEYS, FeatureKey } from '../lib/supabase';

interface BusinessContextType {
  business: Business | null;
  features: FeatureFlag[];
  loading: boolean;
  error: string | null;
  isFeatureEnabled: (feature: FeatureKey) => boolean;
  getFeatureConfig: (feature: FeatureKey) => Record<string, unknown>;
  refreshBusiness: () => Promise<void>;
  setBusinessBySlug: (slug: string) => Promise<void>;
  setBusinessById: (id: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

const STORAGE_KEY = 'reservas_business_id';
const SLUG_STORAGE_KEY = 'reservas_business_slug';

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusiness = async (businessId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .eq('is_active', true)
        .maybeSingle();

      if (bizError) throw bizError;
      if (!biz) {
        setError('Negocio no encontrado');
        return;
      }

      setBusiness(biz as Business);

      // Load feature flags
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('business_id', businessId);

      setFeatures((flags || []) as FeatureFlag[]);
    } catch (err) {
      console.error('Error loading business:', err);
      setError(err instanceof Error ? err.message : 'Error cargando negocio');
    } finally {
      setLoading(false);
    }
  };

  const setBusinessBySlug = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (bizError) throw bizError;
      if (!biz) {
        setError('Negocio no encontrado');
        return;
      }

      localStorage.setItem(STORAGE_KEY, biz.id);
      localStorage.setItem(SLUG_STORAGE_KEY, slug);
      await loadBusiness(biz.id);
    } catch (err) {
      console.error('Error loading business by slug:', err);
      setError(err instanceof Error ? err.message : 'Error cargando negocio');
    }
  };

  const setBusinessById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      localStorage.setItem(STORAGE_KEY, id);
      await loadBusiness(id);
    } catch (err) {
      console.error('Error setting business by id:', err);
      setError(err instanceof Error ? err.message : 'Error cargando negocio');
    }
  };

  const refreshBusiness = async () => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      await loadBusiness(storedId);
    }
  };

  const isFeatureEnabled = (feature: FeatureKey): boolean => {
    const flag = features.find(f => f.feature_key === feature);
    return flag?.is_enabled ?? false;
  };

  const getFeatureConfig = (feature: FeatureKey): Record<string, unknown> => {
    const flag = features.find(f => f.feature_key === feature);
    return flag?.config ?? {};
  };

  // Load business on mount
  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      loadBusiness(storedId);
    } else {
      // Fallback: load the first active business (no hardcoded UUID)
      setLoading(true);
      supabase
        .from('businesses')
        .select('id')
        .eq('is_active', true)
        .order('created_at')
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.id) loadBusiness(data.id);
          else setLoading(false);
        });
    }
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        business,
        features,
        loading,
        error,
        isFeatureEnabled,
        getFeatureConfig,
        refreshBusiness,
        setBusinessBySlug,
        setBusinessById,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextType {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within BusinessProvider');
  return context;
}
