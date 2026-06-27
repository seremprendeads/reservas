import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { supabase, AvailabilitySetting, BlockedDate, Booking, Settings } from '../lib/supabase';
import { useBooking } from '../contexts/BookingContext';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function Calendar() {
  const { setDate, setTime, setStep, bookingData } = useBooking();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, availability, bookedSlots]);

  const loadData = async () => {
    try {
      const [availRes, blockedRes, settingsRes] = await Promise.all([
        supabase.from('availability_settings').select('*'),
        supabase.from('blocked_dates').select('*'),
        supabase.from('settings').select('*').maybeSingle(),
      ]);

      if (availRes.data) setAvailability(availRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data.map((b: BlockedDate) => b.date));
      if (settingsRes.data) setSettings(settingsRes.data);

      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 2);

      const bookingsRes = await supabase
        .from('bookings')
        .select('booking_date, booking_time, booking_status')
        .gte('booking_date', today.toISOString().split('T')[0])
        .in('booking_status', ['confirmed', 'pending']);

      if (bookingsRes.data) {
        const bookingMap = new Map<string, Set<string>>();
        bookingsRes.data.forEach((booking: Pick<Booking, 'booking_date' | 'booking_time'>) => {
          const date = booking.booking_date;
          const times = bookingMap.get(date) || new Set();
          times.add(booking.booking_time);
          bookingMap.set(date, times);
        });
        setBookedSlots(bookingMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const daySettings = availability.find(a => a.day_of_week === dayOfWeek);

    if (!daySettings || !daySettings.is_active) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const [startHour] = daySettings.start_time.split(':').map(Number);
    const [endHour] = daySettings.end_time.split(':').map(Number);
    const duration = settings?.slot_duration_minutes || 60;
    const slotDurationHours = duration / 60;

    for (let hour = startHour; hour < endHour; hour += slotDurationHours) {
      const hours = Math.floor(hour);
      const minutes = Math.round((hour - hours) * 60);
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    const dateStr = date.toISOString().split('T')[0];
    const bookedTimes = bookedSlots.get(dateStr) || new Set();
    const availableSlots = slots.filter(slot => !bookedTimes.has(slot));

    setAvailableTimeSlots(availableSlots);
  };

  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;

    const dateStr = date.toISOString().split('T')[0];
    if (blockedDates.includes(dateStr)) return false;

    const dayOfWeek = date.getDay();
    const daySettings = availability.find(a => a.day_of_week === dayOfWeek);
    return daySettings?.is_active === true;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setDate(date);
    setTime('');
  };

  const handleTimeClick = (time: string) => {
    setTime(time);
  };

  const handleContinue = () => {
    if (bookingData.date && bookingData.time) {
      setStep('form');
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const available = isDateAvailable(date);
      const isSelected = selectedDate &&
        date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={!available}
          className={`h-12 w-12 rounded-xl text-lg font-medium transition-all duration-200
            ${available
              ? isSelected
                ? 'bg-emerald-600 text-white shadow-lg scale-105'
                : 'hover:bg-emerald-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
            }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Selecciona fecha y hora</h2>
        <p className="text-gray-600">Elige un dia disponible y luego selecciona el horario</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-800">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_SHORT.map((day, i) => (
              <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600" />
              <span>Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 opacity-50" />
              <span>No disponible</span>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-semibold text-gray-800">Horarios disponibles</h3>
          </div>

          {selectedDate ? (
            availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {availableTimeSlots.map((time) => {
                  const isSelected = bookingData.time === time;
                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeClick(time)}
                      className={`py-3 px-4 rounded-xl text-lg font-medium transition-all duration-200
                        ${isSelected
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-emerald-50'
                        }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No hay horarios disponibles para esta fecha</p>
              </div>
            )
          ) : (
            <div className="text-center py-10">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Selecciona una fecha para ver los horarios</p>
            </div>
          )}

          {selectedDate && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <CalendarIcon className="w-5 h-5" />
                <span>
                  {selectedDate.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {bookingData.time && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Clock className="w-5 h-5" />
                  <span>{bookingData.time} hs</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!bookingData.date || !bookingData.time}
            className={`w-full py-4 rounded-xl text-lg font-semibold transition-all duration-300
              ${bookingData.date && bookingData.time
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
