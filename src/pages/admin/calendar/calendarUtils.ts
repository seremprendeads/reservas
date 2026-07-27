import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';
import type { CalendarSlot, DaySchedule, BookingBlock, BlockedTimeBlock } from './types';
import { STATUS_COLORS, SLOT_HEIGHT } from './types';

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateDisplay(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getWeekStart(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function getWeekEnd(dateStr: string): string {
  return addDays(getWeekStart(dateStr), 6);
}

export function getMonthStart(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function getMonthEnd(dateStr: string): string {
  const d = parseDate(dateStr);
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getMonthDays(dateStr: string): string[] {
  const start = getMonthStart(dateStr);
  const end = getMonthEnd(dateStr);
  const days: string[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function getCalendarGridDays(dateStr: string): (string | null)[] {
  const monthStart = getMonthStart(dateStr);
  const monthEnd = getMonthEnd(dateStr);
  const startDow = getDayOfWeek(monthStart);
  const endDow = getDayOfWeek(monthEnd);

  const paddingStart = startDow === 0 ? 6 : startDow - 1;
  const paddingEnd = endDow === 0 ? 0 : 7 - endDow;

  const days: (string | null)[] = [];
  for (let i = 0; i < paddingStart; i++) days.push(null);

  let current = monthStart;
  while (current <= monthEnd) {
    days.push(current);
    current = addDays(current, 1);
  }

  for (let i = 0; i < paddingEnd; i++) days.push(null);
  return days;
}

export function generateTimeSlots(startTime: string, endTime: string, slotDuration: number): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m < endMinutes; m += slotDuration) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    slots.push({
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      hour,
      minute,
    });
  }
  return slots;
}

export function getDaySchedule(
  dateStr: string,
  availability: AvailabilitySetting[],
  slotDuration: number
): DaySchedule {
  const dow = getDayOfWeek(dateStr);
  const setting = availability.find(a => a.day_of_week === dow);
  const isActive = setting?.is_active ?? false;
  const startTime = setting?.start_time || '09:00';
  const endTime = setting?.end_time || '18:00';
  const duration = setting?.slot_duration_minutes || slotDuration;

  const slots = isActive ? generateTimeSlots(startTime, endTime, duration) : [];

  return {
    date: dateStr,
    dayOfWeek: dow,
    isActive,
    startTime,
    endTime,
    slotDuration: duration,
    slots,
  };
}

export function getBookingsForDate(bookings: Booking[], dateStr: string): Booking[] {
  return bookings.filter(b => b.booking_date === dateStr);
}

export function getBookingsForWeek(bookings: Booking[], weekStart: string): Booking[] {
  const weekEnd = addDays(weekStart, 6);
  return bookings.filter(b => b.booking_date >= weekStart && b.booking_date <= weekEnd);
}

export function getBookingsForMonth(bookings: Booking[], monthStart: string, monthEnd: string): Booking[] {
  return bookings.filter(b => b.booking_date >= monthStart && b.booking_date <= monthEnd);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getBookingSlotIndex(
  booking: Booking,
  slots: CalendarSlot[]
): number {
  const bookingMinutes = timeToMinutes(booking.booking_time.substring(0, 5));
  return slots.findIndex(s => timeToMinutes(s.time) >= bookingMinutes);
}

export function getBookingDurationSlots(
  _booking: Booking,
  _slots: CalendarSlot[],
  slotDuration: number
): number {
  return Math.max(1, Math.ceil(60 / slotDuration));
}

export function getBookingBlock(
  booking: Booking,
  slots: CalendarSlot[],
  slotDuration: number,
  columnWidth: number,
  columnIndex: number,
  totalColumns: number
): BookingBlock | null {
  const slotIndex = getBookingSlotIndex(booking, slots);
  if (slotIndex === -1) return null;

  const durationSlots = getBookingDurationSlots(booking, slots, slotDuration);
  const colors = STATUS_COLORS[booking.booking_status] || STATUS_COLORS.pending;

  const slotWidth = columnWidth / Math.max(totalColumns, 1);
  const left = columnIndex * slotWidth + 2;
  const width = slotWidth - 4;

  return {
    booking,
    slotIndex,
    durationSlots,
    top: slotIndex * SLOT_HEIGHT,
    height: durationSlots * SLOT_HEIGHT - 2,
    color: colors.bg,
    borderColor: colors.border,
  };
}

export function detectConflicts(
  date: string,
  time: string,
  duration: number,
  bookings: Booking[],
  excludeId?: string
): boolean {
  const newStart = timeToMinutes(time);
  const newEnd = newStart + duration;

  return bookings.some(b => {
    if (b.id === excludeId) return false;
    if (b.booking_date !== date) return false;
    if (b.booking_status === 'cancelled') return false;

    const existingStart = timeToMinutes(b.booking_time.substring(0, 5));
    const existingEnd = existingStart + 60;

    return newStart < existingEnd && newEnd > existingStart;
  });
}

export function isTimeBlocked(
  time: string,
  blockedTimes: BlockedTimeBlock[],
  date: string
): boolean {
  const timeMinutes = timeToMinutes(time);
  return blockedTimes.some(bt => {
    if (bt.date !== date) return false;
    const start = timeToMinutes(bt.startTime);
    const end = timeToMinutes(bt.endTime);
    return timeMinutes >= start && timeMinutes < end;
  });
}

export function isDateBlocked(dateStr: string, blockedDates: BlockedDate[]): boolean {
  return blockedDates.some(bd => bd.date === dateStr);
}

export function getCurrentTimeSlotIndex(slots: CalendarSlot[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < slots.length; i++) {
    if (timeToMinutes(slots[i].time) > currentMinutes) return Math.max(0, i - 1);
  }
  return slots.length - 1;
}

export function getDaySummary(bookings: Booking[], dateStr: string) {
  const dayBookings = getBookingsForDate(bookings, dateStr);
  return {
    total: dayBookings.length,
    pending: dayBookings.filter(b => b.booking_status === 'pending').length,
    confirmed: dayBookings.filter(b => b.booking_status === 'confirmed').length,
    completed: dayBookings.filter(b => b.booking_status === 'completed').length,
    cancelled: dayBookings.filter(b => b.booking_status === 'cancelled').length,
    revenue: dayBookings
      .filter(b => b.payment_status === 'approved')
      .reduce((sum, b) => sum + (b.amount || 0), 0),
  };
}

export function filterBookings(
  bookings: Booking[],
  search: string,
  filters: { status: string[]; services: string[]; paymentMethod: string[] }
): Booking[] {
  let result = bookings;

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(b =>
      b.customer_name.toLowerCase().includes(q) ||
      b.customer_phone.toLowerCase().includes(q) ||
      b.customer_email.toLowerCase().includes(q) ||
      b.booking_code.toLowerCase().includes(q)
    );
  }

  if (filters.status.length > 0) {
    result = result.filter(b => filters.status.includes(b.booking_status));
  }

  if (filters.paymentMethod.length > 0) {
    result = result.filter(b => filters.paymentMethod.includes(b.payment_status));
  }

  return result;
}

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
