import { useMemo } from 'react';
import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';
import type { BlockedTimeBlock } from './types';
import { getCalendarGridDays, getBookingsForDate, getToday, DAY_NAMES, isDateBlocked } from './calendarUtils';
import { BookingCard } from './BookingCard';

interface CalendarMonthViewProps {
  currentDate: string;
  bookings: Booking[];
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  blockedTimes: BlockedTimeBlock[];
  onBookingClick: (booking: Booking) => void;
  onDateClick: (date: string) => void;
}

export function CalendarMonthView({
  currentDate,
  bookings,
  blockedDates,
  onBookingClick,
  onDateClick,
}: CalendarMonthViewProps) {
  const gridDays = useMemo(() => getCalendarGridDays(currentDate), [currentDate]);
  const today = getToday();

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    gridDays.forEach(date => {
      if (date) map.set(date, getBookingsForDate(bookings, date));
    });
    return map;
  }, [bookings, gridDays]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map(day => (
          <div key={day} className="border-r border-border p-3 text-center last:border-r-0">
            <p className="text-xs font-medium text-muted-foreground">{day}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {gridDays.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="border-r border-b border-border min-h-[120px] last:border-r-0 bg-muted/20" />;
          }

          const dayBookings = bookingsByDate.get(date) || [];
          const isCurrentDay = date === today;
          const blocked = isDateBlocked(date, blockedDates);
          const dayNum = new Date(date).getDate();

          return (
            <div
              key={date}
              className={`border-r border-b border-border min-h-[120px] p-1.5 last:border-r-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                isCurrentDay ? 'bg-primary/5' : ''
              } ${blocked ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}
              onClick={() => onDateClick(date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${
                  isCurrentDay ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground' : 'text-foreground'
                }`}>
                  {dayNum}
                </span>
                {blocked && (
                  <span className="text-[9px] text-gray-400 font-medium">Bloqueado</span>
                )}
              </div>

              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => (
                  <BookingCard key={b.id} booking={b} compact onClick={() => onBookingClick(b)} />
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-muted-foreground text-center font-medium">
                    +{dayBookings.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
