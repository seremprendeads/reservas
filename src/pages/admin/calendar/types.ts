import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';

export type CalendarView = 'day' | 'week' | 'month';

export type BlockType = 'break' | 'vacation' | 'personal' | 'holiday' | 'manual';

export interface CalendarFilters {
  status: string[];
  services: string[];
  paymentMethod: string[];
  dateFrom: string;
  dateTo: string;
}

export interface CalendarSlot {
  time: string;
  hour: number;
  minute: number;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  slots: CalendarSlot[];
}

export interface BookingBlock {
  booking: Booking;
  slotIndex: number;
  durationSlots: number;
  top: number;
  height: number;
  color: string;
  borderColor: string;
}

export interface BlockedTimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: BlockType;
  reason: string;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-400' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-400' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-l-gray-300' },
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  break: 'Descanso',
  vacation: 'Vacaciones',
  personal: 'Evento personal',
  holiday: 'Feriado',
  manual: 'Bloqueo manual',
};

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  break: 'bg-gray-200 border-gray-300',
  vacation: 'bg-purple-100 border-purple-300',
  personal: 'bg-orange-100 border-orange-300',
  holiday: 'bg-red-100 border-red-300',
  manual: 'bg-gray-300 border-gray-400',
};

export const SLOT_HEIGHT = 140;
export const HOURS_START = 0;
export const HOURS_END = 24;
