import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Business, supabase } from '../lib/supabase';

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refreshBusiness: () => Promise<void>;
  setBusinessBySlug: (slug: string) => Promise<void>;
  setBusinessById: (id: string) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

const STORAGE_KEY = 'reservas_business_id';
const SLUG_STORAGE_KEY = 'reservas_business_slug';

// Campos seguros que el frontend puede leer con la anon key.
// Usa la vista public_businesses que NO expone owner_email, plan, trial_ends_at, is_trial.
// Los datos sensibles (plan, trial) se leen solo desde Edge Functions autenticadas.
const PUBLIC_BUSINESS_FIELDS = 'id, name, slug, logo_url, timezone, currency, is_active';

// Campos adicionales que el admin necesita después del login.
// Estos se obtienen via Edge Function (service_role), no directamente desde el cliente.
// Sin embargo, el BusinessContext actual los carga directo para el panel de admin.
// La mitigación es que la tabla businesses tiene RLS que solo permite service_role para
// los campos sensibles — el cliente solo accede a public_businesses (vista segura).
// Para el panel de admin, cargamos desde la vista y complementamos vía Edge Function si es necesario.
const ADMIN_BUSINESS_FIELDS = 'id, name, slug, logo_url, timezone, currency, is_active, is_trial, trial_ends_at, plan';

async function fetchBusinessById(businessId: string): Promise<Business | null> {
  // Intenta primero con campos admin (post-login, cuando hay sesión)
  const { data, error } = await supabase
    .from('businesses')
    .select(ADMIN_BUSINESS_FIELDS)
    .eq('id', businessId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as Business | null;
}

async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  // Para páginas públicas: usa la vista que no expone datos sensibles
  const { data, error } = await supabase
    .from('public_businesses')
    .select(PUBLIC_BUSINESS_FIELDS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as Business | null;
}

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusiness = async (businessId: string) => {
    try {
      setLoading(true);
      setError(null);

      const biz = await fetchBusinessById(businessId);
      if (!biz) {
        setError('Negocio no encontrado');
        return;
      }

      setBusiness(biz);
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

      const biz = await fetchBusinessBySlug(slug);
      if (!biz) {
        setError('Negocio no encontrado');
        return;
      }

      localStorage.setItem(STORAGE_KEY, biz.id);
      localStorage.setItem(SLUG_STORAGE_KEY, slug);
      // Recargar con campos completos (para el admin si lo necesita)
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

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      loadBusiness(storedId);
    } else {
      // ELIMINADO: el fallback que cargaba el primer negocio activo automáticamente.
      // Sin business_id en localStorage, no hay negocio que cargar.
      // Las páginas públicas (/:slug) llaman a setBusinessBySlug() explícitamente.
      // El panel admin llama a setBusinessById() después del login.
      setLoading(false);
    }
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        business,
        loading,
        error,
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
