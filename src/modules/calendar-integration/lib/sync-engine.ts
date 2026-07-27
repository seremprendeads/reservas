import type { Booking } from '../../../lib/supabase';
import type { CalendarEvent } from '../types';

export function bookingToCalendarEvent(booking: Booking, durationMinutes: number = 60): CalendarEvent {
  const date = booking.booking_date;
  const time = booking.booking_time?.substring(0, 5) || '09:00';

  const start = `${date}T${time}:00-03:00`;

  const [h, m] = time.split(':').map(Number);
  const endMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const end = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00-03:00`;

  const statusMap: Record<string, CalendarEvent['status']> = {
    pending: 'tentative',
    confirmed: 'confirmed',
    completed: 'confirmed',
    cancelled: 'cancelled',
  };

  const lines: string[] = [];
  lines.push(`Cliente: ${booking.customer_name}`);
  lines.push(`Telefono: ${booking.customer_phone}`);
  if (booking.customer_email) lines.push(`Email: ${booking.customer_email}`);
  lines.push(`Estado: ${booking.booking_status}`);
  if (booking.amount) lines.push(`Monto: $${booking.amount.toLocaleString('es-AR')}`);
  if (booking.booking_code) lines.push(`Codigo: ${booking.booking_code}`);
  if (booking.notas_admin) lines.push(`Notas: ${booking.notas_admin}`);

  return {
    booking_id: booking.id,
    title: `${booking.customer_name} - ${booking.booking_code}`,
    description: lines.join('\n'),
    start_datetime: start,
    end_datetime: end,
    status: statusMap[booking.booking_status] || 'tentative',
  };
}

export function shouldSync(booking: Booking): boolean {
  if (!booking.booking_date || !booking.booking_time) return false;
  if (!booking.customer_name) return false;
  return true;
}

export function getSyncAction(
  booking: Booking,
  existingExternalId: string | null
): 'create' | 'update' | 'delete' | 'skip' {
  if (booking.booking_status === 'cancelled') {
    return existingExternalId ? 'delete' : 'skip';
  }
  if (existingExternalId) return 'update';
  return 'create';
}
