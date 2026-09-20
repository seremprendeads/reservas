import { supabase } from '../../lib/supabase';
import { getToken } from '../../lib/admin-session';

export function getStatusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'info'; label: string }> = {
    confirmed: { variant: 'success', label: 'Confirmada' },
    pending: { variant: 'warning', label: 'Pendiente' },
    cancelled: { variant: 'destructive', label: 'Cancelada' },
    completed: { variant: 'info', label: 'Completada' },
  };
  return map[status] || { variant: 'warning' as const, label: status };
}

export function getPaymentBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
    approved: { variant: 'success', label: 'Pagado' },
    pending: { variant: 'warning', label: 'Pendiente' },
    rejected: { variant: 'destructive', label: 'Rechazado' },
  };
  return map[status] || { variant: 'warning' as const, label: status };
}

export function authInvoke(fnName: string, body: Record<string, unknown> = {}) {
  const token = getToken();
  return supabase.functions.invoke(fnName, {
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

// Cuando una Edge Function devuelve un status distinto de 2xx, supabase-js
// tira un error generico ("Edge Function returned a non-2xx status code")
// y deja el body real sin leer en error.context (un Response crudo). Esto
// hacia que cualquier fallo de guardado mostrara siempre el mismo mensaje
// generico, sin poder saber que estaba fallando en el servidor.
export async function describeFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return body.error;
    } catch {
      // el body no era JSON — seguimos con el fallback
    }
  }
  if (error instanceof Error && error.message && error.message !== 'Edge Function returned a non-2xx status code') {
    return error.message;
  }
  return fallback;
}
