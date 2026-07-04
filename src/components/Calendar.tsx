import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Users, CheckCircle } from 'lucide-react';
import { supabase, AvailabilitySetting, BlockedDate, Booking, Settings } from '../lib/supabase';
import { useBooking } from '../contexts/BookingContext';

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ─── Formulario lista de espera ───────────────────────────────────────────────
function WaitingListForm({ selectedDate, onClose }: { selectedDate: Date; onClose: () => void }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [horario, setHorario] = useState('');
  const [servicio, setServicio] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 3) e.nombre = 'El nombre es obligatorio (mínimo 3 caracteres)';
    if (!telefono.trim()) e.telefono = 'El teléfono es obligatorio';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) e.email = 'Email inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('waiting_list').insert({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        fecha_deseada: selectedDate.toISOString().split('T')[0],
        horario_deseado: horario || null,
        servicio: servicio.trim() || null,
        estado: 'pendiente',
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Error al guardar. Intentá de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">¡Listo!</h3>
        <p className="text-gray-600 mb-6">
          Te agregamos a la lista de espera. Te avisaremos si se libera un horario.
        </p>
        <button onClick={onClose} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
          Volver al calendario
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Lista de espera</h3>
          <p className="text-sm text-gray-500">
            {selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Juan Pérez"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.nombre ? 'border-red-300' : 'border-gray-200 focus:border-emerald-500'}`} />
          {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="+54 11 1234-5678"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.telefono ? 'border-red-300' : 'border-gray-200 focus:border-emerald-500'}`} />
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="juan@email.com"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-emerald-500'}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horario deseado <span className="text-gray-400">(opcional)</span></label>
          <input type="time" value={horario} onChange={e => setHorario(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servicio <span className="text-gray-400">(opcional)</span></label>
          <input type="text" value={servicio} onChange={e => setServicio(e.target.value)}
            placeholder="Ej: Consulta, limpieza, etc."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Anotarme'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Calendario principal ─────────────────────────────────────────────────────
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
  const [showWaitingForm, setShowWaitingForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots(selectedDate);
      setShowWaitingForm(false); // reset al cambiar fecha
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
  // Normalizar formato HH:MM:SS → HH:MM
  times.add(booking.booking_time.slice(0, 5));
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
    setAvailableTimeSlots(slots.filter(slot => !bookedTimes.has(slot)));
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
    return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setDate(date);
    setTime('');
  };

  const handleContinue = () => {
    if (bookingData.date && bookingData.time) setStep('form');
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const available = isDateAvailable(date);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push(
        <button key={day} onClick={() => handleDateClick(date)} disabled={!available}
          className={`h-9 w-full rounded-lg text-sm font-medium transition-all duration-200
            ${available
              ? isSelected
                ? 'bg-emerald-600 text-white shadow-lg scale-105'
                : 'hover:bg-emerald-100 text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
            }`}>
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
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Selecciona fecha y hora</h2>
        <p className="text-gray-600 text-sm sm:text-base">Elige un día disponible y luego selecciona el horario</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
        {/* Calendario */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS_SHORT.map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">{renderCalendar()}</div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-600" /><span>Seleccionado</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-100" /><span>Disponible</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200 opacity-50" /><span>No disponible</span></div>
          </div>
        </div>

        {/* Horarios / Lista de espera */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {showWaitingForm && selectedDate ? (
            <WaitingListForm
              selectedDate={selectedDate}
              onClose={() => setShowWaitingForm(false)}
            />
          ) : (
            <>
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
                        <button key={time} onClick={() => setTime(time)}
                          className={`py-3 px-4 rounded-xl text-lg font-medium transition-all duration-200
                            ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-emerald-50'}`}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // No hay horarios disponibles → mostrar lista de espera
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-7 h-7 text-amber-500" />
                    </div>
                    <p className="text-gray-700 font-medium mb-2">No hay turnos disponibles para esta fecha</p>
                    <p className="text-gray-500 text-sm mb-6">Podés anotarte en la lista de espera y te avisamos si se libera un horario.</p>
                    <button
                      onClick={() => setShowWaitingForm(true)}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                    >
                      <Users className="w-5 h-5" />
                      Unirme a la lista de espera
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Selecciona una fecha para ver los horarios</p>
                </div>
              )}

              {selectedDate && availableTimeSlots.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <CalendarIcon className="w-5 h-5" />
                    <span>{selectedDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {bookingData.time && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <Clock className="w-5 h-5" />
                      <span>{bookingData.time} hs</span>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleContinue} disabled={!bookingData.date || !bookingData.time}
                className={`w-full py-4 rounded-xl text-lg font-semibold transition-all duration-300
                  ${bookingData.date && bookingData.time
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                Continuar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}