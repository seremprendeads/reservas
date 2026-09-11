import { supabase } from './supabase';

// ============================================================================
// DOCUMENTACIÓN LEGAL DEL NEGOCIO
//
// Los documentos NO se guardan como texto. Se renderizan en cada visita
// con los datos actuales del negocio:
//   - businesses.name              → nombre comercial (Sistema → Perfil)
//   - business_legal_info.*        → datos legales (Sistema → Perfil)
//
// Lectura pública: RPC get_public_business_legal_info(p_slug).
//   El tenant se resuelve en la base por el slug de la URL.
// Lectura/escritura admin: Edge Function admin-legal-info.
//   El tenant sale del JWT, nunca del body.
// ============================================================================

// Fecha de la última revisión de los textos base. Actualizarla si se cambian
// los textos de src/pages/legal/documents.tsx.
export const LEGAL_TEMPLATE_UPDATED_AT = '2026-09-11';

export type LegalDocKey = 'privacidad' | 'cookies' | 'condiciones';

export const LEGAL_DOCS: { key: LegalDocKey; label: string; title: string }[] = [
  { key: 'privacidad', label: 'Privacidad', title: 'Política de privacidad' },
  { key: 'cookies', label: 'Cookies', title: 'Política de cookies' },
  { key: 'condiciones', label: 'Condiciones de reserva', title: 'Condiciones de reserva' },
];

export function legalPath(slug: string, doc: LegalDocKey): string {
  return `/${encodeURIComponent(slug)}/${doc}`;
}

export type LegalInfoFields = {
  legal_name: string;
  tax_id: string;
  address: string;
  city: string;
  province: string;
  country: string;
  contact_email: string;
  phone: string;
};

export const EMPTY_LEGAL_INFO: LegalInfoFields = {
  legal_name: '',
  tax_id: '',
  address: '',
  city: '',
  province: '',
  country: '',
  contact_email: '',
  phone: '',
};

export type PublicLegalInfo = {
  business_name: string;
  slug: string;
  logo_url: string | null;
  legal_name: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  contact_email: string | null;
  phone: string | null;
  updated_at: string | null;
};

// Datos necesarios para considerar completa la información legal.
// El teléfono es opcional: el email ya cubre el medio de contacto.
export const LEGAL_REQUIRED_FIELDS: { key: keyof LegalInfoFields; label: string }[] = [
  { key: 'legal_name', label: 'Titular o razón social' },
  { key: 'tax_id', label: 'CUIT' },
  { key: 'address', label: 'Domicilio' },
  { key: 'city', label: 'Ciudad o localidad' },
  { key: 'province', label: 'Provincia' },
  { key: 'country', label: 'País' },
  { key: 'contact_email', label: 'Email de contacto' },
];

export function getMissingLegalFields(businessName: string | null | undefined, info: LegalInfoFields): string[] {
  const missing: string[] = [];
  if (!businessName?.trim()) missing.push('Nombre del negocio');
  for (const f of LEGAL_REQUIRED_FIELDS) {
    if (!info[f.key]?.trim()) missing.push(f.label);
  }
  return missing;
}

export function isArgentina(country: string | null | undefined): boolean {
  if (!country) return false;
  const c = country.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return c === 'argentina' || c === 'ar' || c === 'republica argentina';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// CUIT argentino: 11 dígitos (se aceptan guiones o espacios).
export function isValidCuit(value: string): boolean {
  return value.replace(/[\s-]/g, '').match(/^\d{11}$/) !== null;
}

export async function fetchPublicLegalInfo(slug: string): Promise<PublicLegalInfo | null> {
  const { data, error } = await supabase.rpc('get_public_business_legal_info', { p_slug: slug });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PublicLegalInfo) || null;
}

// Resuelve el slug público de un negocio a partir de su id.
// Se usa en la landing, cuyo slug propio (landing_pages.slug) puede no
// coincidir con el del negocio si este se renombró.
export async function fetchPublicSlugById(businessId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('public_businesses')
    .select('slug')
    .eq('id', businessId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { slug: string }).slug || null;
}
