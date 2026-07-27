import type { Booking } from '../../../lib/supabase';
import { STATUS_COLORS, STATUS_LABELS } from './types';

interface BookingCardProps {
  booking: Booking;
  compact?: boolean;
  onClick: () => void;
}

export function BookingCard({ booking, compact = false, onClick }: BookingCardProps) {
  const colors = STATUS_COLORS[booking.booking_status] || STATUS_COLORS.pending;
  const time = booking.booking_time.substring(0, 5);

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full rounded-lg border-l-3 ${colors.border} ${colors.bg} p-1.5 text-left transition-all hover:shadow-sm cursor-pointer`}
      >
        <p className={`text-xs font-semibold truncate ${colors.text}`}>{time} - {booking.customer_name}</p>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-l-4 ${colors.border} ${colors.bg} p-3 text-left transition-all hover:shadow-md cursor-pointer group`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${colors.text}`}>
            {booking.customer_name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {time}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text} ring-1 ring-inset ring-current/10`}>
          {STATUS_LABELS[booking.booking_status] || booking.booking_status}
        </span>
      </div>
      {booking.amount > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          ${booking.amount.toLocaleString('es-AR')}
        </p>
      )}
    </button>
  );
}
