import { useMemo } from 'react';
import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';
import type { BlockedTimeBlock } from './types';
import { SLOT_HEIGHT } from './types';
import { addDays, getWeekStart, getDaySchedule, getBookingsForDate, getCurrentTimeSlotIndex, getToday, DAY_NAMES, formatDate } from './calendarUtils';
import { BookingCard } from './BookingCard';

interface CalendarWeekViewProps {
  currentDate: string;
  bookings: Booking[];
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  blockedTimes: BlockedTimeBlock[];
  slotDuration: number;
  onBookingClick: (booking: Booking) => void;
  onSlotClick: (date: string, time: string) => void;
}

export function CalendarWeekView({
  currentDate,
  bookings,
  availability,
  blockedDates: _blockedDates,
  blockedTimes: _blockedTimes,
  slotDuration,
  onBookingClick,
  onSlotClick,
}: CalendarWeekViewProps) {
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const daySchedules = useMemo(
    () => weekDays.map(d => getDaySchedule(d, availability, slotDuration)),
    [weekDays, availability, slotDuration]
  );

  const maxSlots = useMemo(() => {
    const max = Math.max(...daySchedules.map(s => s.slots.length), 0);
    return max;
  }, [daySchedules]);

  const allSlots = useMemo(() => {
    const first = daySchedules.find(s => s.slots.length > 0);
    return first?.slots || [];
  }, [daySchedules]);

  const isToday = currentDate === getToday();
  const currentTimeIndex = isToday ? getCurrentTimeSlotIndex(allSlots) : -1;

  const bookingsByDateAndTime = useMemo(() => {
    const map = new Map<string, Map<string, Booking[]>>();
    weekDays.forEach(date => {
      const dayMap = new Map<string, Booking[]>();
      getBookingsForDate(bookings, date).forEach(b => {
        const time = b.booking_time.substring(0, 5);
        if (!dayMap.has(time)) dayMap.set(time, []);
        dayMap.get(time)!.push(b);
      });
      map.set(date, dayMap);
    });
    return map;
  }, [bookings, weekDays]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-8 border-b border-border">
        <div className="border-r border-border p-2" />
        {weekDays.map((date, i) => {
          const isCurrentDay = date === getToday();
          return (
            <div key={date} className={`border-r border-border p-2 text-center ${isCurrentDay ? 'bg-primary/5' : ''}`}>
              <p className="text-xs text-muted-foreground">{DAY_NAMES[i]}</p>
              <p className={`text-sm font-semibold ${isCurrentDay ? 'text-primary' : 'text-foreground'}`}>
                {new Date(date).getDate()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="relative grid grid-cols-8">
          <div className="border-r border-border">
            {allSlots.map((slot, i) => (
              <div key={slot.time} className="border-b border-border px-2 py-1" style={{ height: SLOT_HEIGHT }}>
                <span className="text-[10px] font-medium text-muted-foreground">{slot.time}</span>
                {isToday && i === currentTimeIndex && (
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {weekDays.map((date, dayIdx) => {
            const schedule = daySchedules[dayIdx];
            const dayMap = bookingsByDateAndTime.get(date) || new Map();

            return (
              <div key={date} className={`border-r border-border ${date === getToday() ? 'bg-primary/[0.02]' : ''}`}>
                {allSlots.map((slot, slotIdx) => {
                  const slotBookings = dayMap.get(slot.time) || [];
                  const isActive = schedule.isActive && slotIdx < schedule.slots.length;

                  return (
                    <div
                      key={slot.time}
                      className={`border-b border-border px-1 py-0.5 ${
                        isActive ? 'hover:bg-muted/30 cursor-pointer' : 'bg-gray-50 dark:bg-gray-800/30'
                      } transition-colors`}
                      style={{ height: SLOT_HEIGHT }}
                      onClick={() => isActive && onSlotClick(date, slot.time)}
                    >
                      {slotBookings.map(b => (
                        <BookingCard key={b.id} booking={b} compact onClick={() => onBookingClick(b)} />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {isToday && currentTimeIndex >= 0 && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: currentTimeIndex * SLOT_HEIGHT }}
            >
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
