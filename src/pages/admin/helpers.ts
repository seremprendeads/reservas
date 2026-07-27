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
