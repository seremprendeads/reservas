import { useState, useEffect, useCallback, useRef } from 'react';
import type { Booking, AvailabilitySetting, BlockedDate } from '../../../lib/supabase';
import type { CalendarView, CalendarFilters, BlockedTimeBlock } from './types';
import { CalendarHeader } from './CalendarHeader';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { BookingDrawer } from './BookingDrawer';
import { BookingFormCalendar } from './BookingFormCalendar';
import { BlockedTimeModal } from './BlockedTimeModal';
import { getToday, addDays, getWeekStart, getMonthStart, getMonthEnd, getDaySummary, filterBookings } from './calendarUtils';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';

interface CalendarPageProps {
  bookings: Booking[];
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function CalendarPage({
  bookings,
  availability,
  blockedDates,
  onRefresh,
  onUpdateStatus,
  onDelete,
}: CalendarPageProps) {
  const { business } = useBusiness();
  const [currentDate, setCurrentDate] = useState(getToday());
  const [view, setView] = useState<CalendarView>('week');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CalendarFilters>({
    status: [],
    services: [],
    paymentMethod: [],
    dateFrom: '',
    dateTo: '',
  });

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formDate, setFormDate] = useState<string | undefined>();
  const [formTime, setFormTime] = useState<string | undefined>();
  const [blockedTimesOpen, setBlockedTimesOpen] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTimeBlock[]>([]);

  const [slotDuration, setSlotDuration] = useState(60);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!business?.id) return;
    supabase.from('settings').select('slot_duration_minutes').eq('business_id', business.id).maybeSingle()
      .then(({ data }) => { if (data?.slot_duration_minutes) setSlotDuration(data.slot_duration_minutes); });
  }, [business?.id]);

  const loadBlockedTimes = useCallback(() => {
    if (!business?.id) return;
    const stored = localStorage.getItem(`blocked_times_${business.id}`);
    if (stored) {
      try { setBlockedTimes(JSON.parse(stored)); } catch { setBlockedTimes([]); }
    }
  }, [business?.id]);

  useEffect(() => { loadBlockedTimes(); }, [loadBlockedTimes]);

  const saveBlockedTimes = useCallback((blocks: BlockedTimeBlock[]) => {
    setBlockedTimes(blocks);
    if (business?.id) localStorage.setItem(`blocked_times_${business.id}`, JSON.stringify(blocks));
  }, [business?.id]);

  const filteredBookings = filterBookings(bookings, search, filters);

  const getDateRange = useCallback(() => {
    if (view === 'day') return { start: currentDate, end: currentDate };
    if (view === 'week') return { start: getWeekStart(currentDate), end: addDays(getWeekStart(currentDate), 6) };
    return { start: getMonthStart(currentDate), end: getMonthEnd(currentDate) };
  }, [view, currentDate]);

  const range = getDateRange();
  const rangeBookings = filteredBookings.filter(
    b => b.booking_date >= range.start && b.booking_date <= range.end
  );

  const summary = getDaySummary(filteredBookings, currentDate);

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(d => addDays(d, -1));
    else if (view === 'week') setCurrentDate(d => addDays(d, -7));
    else setCurrentDate(d => addDays(getMonthStart(d), -1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(d => addDays(d, 1));
    else if (view === 'week') setCurrentDate(d => addDays(d, 7));
    else setCurrentDate(d => addDays(getMonthEnd(d), 1));
  };

  const handleToday = () => setCurrentDate(getToday());

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleSlotClick = (date: string, time: string) => {
    setFormDate(date);
    setFormTime(time);
    setFormOpen(true);
  };

  const handleNewBooking = () => {
    setFormDate(currentDate);
    setFormTime(undefined);
    setFormOpen(true);
  };

  const handleDateClick = (date: string) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleAddBlockedTime = (block: Omit<BlockedTimeBlock, 'id'>) => {
    const newBlock: BlockedTimeBlock = { ...block, id: `bt_${Date.now()}` };
    saveBlockedTimes([...blockedTimes, newBlock]);
  };

  const handleRemoveBlockedTime = (id: string) => {
    saveBlockedTimes(blockedTimes.filter(b => b.id !== id));
  };

  const handleSaveBooking = async (bookingData: Partial<Booking>) => {
    if (!business?.id) return;
    await supabase.from('bookings').insert({
      business_id: business.id,
      booking_code: `CAL-${Date.now().toString(36).toUpperCase()}`,
      customer_name: bookingData.customer_name || '',
      customer_phone: bookingData.customer_phone || '',
      customer_email: bookingData.customer_email || '',
      booking_date: bookingData.booking_date || currentDate,
      booking_time: bookingData.booking_time || '09:00',
      payment_status: 'pending',
      booking_status: 'pending',
      amount: bookingData.amount || 0,
      notas_admin: bookingData.notas_admin || null,
    });
    onRefresh();
  };

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {}, 60000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  return (
    <div className="space-y-5">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNewBooking={handleNewBooking}
        onBlockedTimes={() => setBlockedTimesOpen(true)}
      />

      <CalendarToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        summary={summary}
      />

      {view === 'day' && (
        <CalendarDayView
          currentDate={currentDate}
          bookings={rangeBookings}
          availability={availability}
          blockedDates={blockedDates}
          blockedTimes={blockedTimes}
          slotDuration={slotDuration}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}

      {view === 'week' && (
        <CalendarWeekView
          currentDate={currentDate}
          bookings={rangeBookings}
          availability={availability}
          blockedDates={blockedDates}
          blockedTimes={blockedTimes}
          slotDuration={slotDuration}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}

      {view === 'month' && (
        <CalendarMonthView
          currentDate={currentDate}
          bookings={rangeBookings}
          availability={availability}
          blockedDates={blockedDates}
          blockedTimes={blockedTimes}
          onBookingClick={handleBookingClick}
          onDateClick={handleDateClick}
        />
      )}

      <BookingDrawer
        booking={selectedBooking}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedBooking(null); }}
        onUpdateStatus={(id, status) => { onUpdateStatus(id, status); setDrawerOpen(false); }}
        onDelete={(id) => { onDelete(id); setDrawerOpen(false); }}
      />

      <BookingFormCalendar
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setFormDate(undefined); setFormTime(undefined); }}
        onSave={handleSaveBooking}
        selectedDate={formDate}
        selectedTime={formTime}
        bookings={bookings}
        availability={availability}
        blockedTimes={blockedTimes}
        slotDuration={slotDuration}
        businessId={business?.id || ''}
      />

      <BlockedTimeModal
        isOpen={blockedTimesOpen}
        onClose={() => setBlockedTimesOpen(false)}
        blockedTimes={blockedTimes}
        onAdd={handleAddBlockedTime}
        onRemove={handleRemoveBlockedTime}
      />
    </div>
  );
}
