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

// Campos que el frontend puede leer con la anon key, tanto en paginas
// publicas como en el panel de admin ya logueado. Vienen SIEMPRE de la vista
// public_businesses (nunca de la tabla businesses directo): la vista nunca
// expone owner_email ni otras columnas sensibles que puedan agregarse a la
// tabla en el futuro, y filtra is_active = true de entrada.
const BUSINESS_FIELDS = 'id, name, slug, logo_url, timezone, currency, is_active, is_trial, trial_ends_at, plan, product_limit';

async function fetchBusinessById(businessId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('public_businesses')
    .select(BUSINESS_FIELDS)
    .eq('id', businessId)
    .maybeSingle();

  if (error) throw error;
  return data as Business | null;
}

// err.message a veces viene vacío en errores de Postgrest (ej: RLS deniega
// sin mensaje claro) — sumamos code/details/hint para poder diagnosticar
// sin acceso a los logs de Supabase.
function describeError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint, e.code].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  if (err instanceof Error) return err.message;
  return 'Error cargando negocio';
}

async function fetchBusinessBySlug(slug: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('public_businesses')
    .select(BUSINESS_FIELDS)
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
      setError(describeError(err));
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
      setBusiness(biz);
    } catch (err) {
      console.error('Error loading business by slug:', err);
      setError(describeError(err));
    } finally {
      setLoading(false);
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
      setError(describeError(err));
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
