import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, Loader2 } from 'lucide-react';
import type { Booking, AvailabilitySetting, Service } from '../../../lib/supabase';
import type { BlockedTimeBlock } from './types';
import { getDaySchedule, detectConflicts, isTimeBlocked, getToday } from './calendarUtils';
import { supabase } from '../../../lib/supabase';

interface BookingFormCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Partial<Booking>) => void;
  selectedDate?: string;
  selectedTime?: string;
  bookings: Booking[];
  availability: AvailabilitySetting[];
  blockedTimes: BlockedTimeBlock[];
  slotDuration: number;
  businessId: string;
}

export function BookingFormCalendar({
  isOpen,
  onClose,
  onSave,
  selectedDate: initialDate,
  selectedTime: initialTime,
  bookings,
  availability,
  blockedTimes,
  slotDuration,
  businessId,
}: BookingFormCalendarProps) {
  const [date, setDate] = useState(initialDate || getToday());
  const [time, setTime] = useState(initialTime || '09:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || getToday());
      setTime(initialTime || '09:00');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setServiceId('');
      setNotes('');
      setError('');

      supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true).order('sort_order')
        .then(({ data }) => { if (data) setServices(data); });
    }
  }, [isOpen, initialDate, initialTime, businessId]);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialTime) setTime(initialTime);
  }, [initialDate, initialTime]);

  const schedule = getDaySchedule(date, availability, slotDuration);
  const availableSlots = schedule.isActive
    ? schedule.slots.filter(s => !isTimeBlocked(s.time, blockedTimes, date))
    : [];

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Nombre y teléfono son obligatorios');
      return;
    }

    if (detectConflicts(date, time, 60, bookings)) {
      setError('Ya existe una reserva en ese horario');
      return;
    }

    setLoading(true);
    try {
      const service = services.find(s => s.id === serviceId);
      onSave({
        booking_date: date,
        booking_time: time,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        amount: service?.price || 0,
        notas_admin: notes.trim() || null,
        booking_status: 'pending',
        payment_status: 'pending',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-lg font-display font-semibold text-foreground">Nueva Reserva</h3>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Hora</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
                >
                  {availableSlots.length === 0 && schedule.slots.map(s => (
                    <option key={s.time} value={s.time}>{s.time}</option>
                  ))}
                  {availableSlots.map(s => (
                    <option key={s.time} value={s.time}>{s.time}</option>
                  ))}
                </select>
              </div>
              {!schedule.isActive && (
                <p className="mt-1 text-xs text-amber-600">Este día no tiene horarios configurados</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Servicio</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none"
              >
                <option value="">Sin servicio</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - ${s.price.toLocaleString('es-AR')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre del cliente *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Teléfono *</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Notas</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas internas..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border px-6 py-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar Reserva
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
