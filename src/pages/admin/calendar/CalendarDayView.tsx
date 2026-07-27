import { useMemo } from 'react';
import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';
import type { BlockedTimeBlock } from './types';
import { SLOT_HEIGHT } from './types';
import { getDaySchedule, getBookingsForDate, getCurrentTimeSlotIndex, timeToMinutes, isTimeBlocked } from './calendarUtils';
import { BookingCard } from './BookingCard';
import { getToday } from './calendarUtils';

interface CalendarDayViewProps {
  currentDate: string;
  bookings: Booking[];
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  blockedTimes: BlockedTimeBlock[];
  slotDuration: number;
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (date: string, time: string) => void;
}

export function CalendarDayView({
  currentDate,
  bookings,
  availability,
  blockedDates: _blockedDates,
  blockedTimes,
  slotDuration,
  onBookingClick,
  onSlotClick,
}: CalendarDayViewProps) {
  const schedule = useMemo(
    () => getDaySchedule(currentDate, availability, slotDuration),
    [currentDate, availability, slotDuration]
  );

  const dayBookings = useMemo(
    () => getBookingsForDate(bookings, currentDate),
    [bookings, currentDate]
  );

  const isToday = currentDate === getToday();
  const currentTimeIndex = isToday ? getCurrentTimeSlotIndex(schedule.slots) : -1;

  const bookingsByTime = useMemo(() => {
    const map = new Map<string, Booking[]>();
    dayBookings.forEach(b => {
      const time = b.booking_time.substring(0, 5);
      if (!map.has(time)) map.set(time, []);
      map.get(time)!.push(b);
    });
    return map;
  }, [dayBookings]);

  if (!schedule.isActive) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-border bg-card">
        <p className="text-muted-foreground">Día no laborable</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
        <div className="relative">
          {schedule.slots.map((slot, i) => {
            const slotBookings = bookingsByTime.get(slot.time) || [];
            const blocked = isTimeBlocked(slot.time, blockedTimes, currentDate);

            return (
              <div
                key={slot.time}
                className={`flex border-b border-border ${blocked ? 'bg-gray-100 dark:bg-gray-800/50' : 'hover:bg-muted/30'} transition-colors cursor-pointer`}
                style={{ height: SLOT_HEIGHT }}
                onClick={() => !blocked && onSlotClick(currentDate, slot.time)}
              >
                <div className="w-20 shrink-0 border-r border-border bg-card/50 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{slot.time}</span>
                  {isToday && i === currentTimeIndex && (
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 px-2 py-1 relative">
                  {blocked ? (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs text-gray-400 font-medium">Bloqueado</span>
                    </div>
                  ) : slotBookings.length > 0 ? (
                    <div className="flex gap-2 h-full items-center">
                      {slotBookings.map(b => (
                        <div key={b.id} className="flex-1">
                          <BookingCard booking={b} onClick={() => onBookingClick(b)} />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {isToday && currentTimeIndex >= 0 && (
            <div
              className="absolute left-20 right-0 z-10 pointer-events-none"
              style={{ top: currentTimeIndex * SLOT_HEIGHT + (new Date().getMinutes() % slotDuration) / slotDuration * SLOT_HEIGHT }}
            >
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
