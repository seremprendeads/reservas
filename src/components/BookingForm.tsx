import { useState } from 'react';
import { User, Phone, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { supabase, Settings, Booking } from '../lib/supabase';
import { useEffect } from 'react';

export function BookingForm() {
  const { bookingData, setCustomerInfo, setStep, setPaymentInfo } = useBooking();
  const [name, setName] = useState(bookingData.name);
  const [phone, setPhone] = useState(bookingData.phone);
  const [email, setEmail] = useState(bookingData.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').maybeSingle();
    if (data) setSettings(data);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!phone.trim()) {
      newErrors.phone = 'El celular es obligatorio';
    } else if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Ingresa un numero de celular valido';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingresa un email valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!settings) return;

    setCustomerInfo(name, phone, email);
    setLoading(true);

    try {
      const dateStr = bookingData.date!.toISOString().split('T')[0];

      const bookingRes = await supabase.rpc('generate_booking_code');

      if (bookingRes.error) {
        throw new Error('Error al generar codigo de reserva');
      }

      const bookingCode = bookingRes.data;

      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          booking_code: bookingCode,
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          booking_date: dateStr,
          booking_time: bookingData.time,
          payment_status: 'pending',
          booking_status: 'pending',
          amount: settings.price,
        });

      if (insertError) {
        throw new Error('Error al crear la reserva');
      }

      const { data: preference, error: prefError } = await supabase.functions.invoke('create-payment', {
        body: {
          bookingCode,
          amount: settings.price,
          email,
          name,
        },
      });

      if (prefError || !preference) {
        throw new Error('Error al crear preferencia de pago');
      }

      const { data: updateData, error: updateError } = await supabase
        .from('bookings')
        .update({ preference_id: preference.id })
        .eq('booking_code', bookingCode);

      setPaymentInfo(preference.id, bookingCode, settings.price, settings.currency);
      setStep('payment');
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Error al procesar la reserva. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => setStep('calendar')}
        className="flex items-center gap-2 text-booking-muted hover:text-booking-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tus datos</h2>
        <p className="text-gray-600 mb-8">
          Completa tu informacion para confirmar la reserva
        </p>

        <div className="bg-booking-primary-light rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-booking-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {bookingData.date?.getDate()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {bookingData.date?.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-sm text-gray-600">{bookingData.time} hs</p>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Perez"
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-colors text-lg
                  ${errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-booking-primary focus:ring-booking-primary'
                  } focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Celular
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-colors text-lg
                  ${errors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-booking-primary focus:ring-booking-primary'
                  } focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-colors text-lg
                  ${errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 focus:border-booking-primary focus:ring-booking-primary'
                  } focus:outline-none focus:ring-2`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {settings && (
            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total a pagar:</span>
              <span className="text-2xl font-bold text-booking-primary">
                ${settings.price.toLocaleString('es-AR')} {settings.currency}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-booking-primary text-white rounded-xl font-semibold text-lg
              hover:bg-booking-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? 'Procesando...' : 'Continuar al pago'}
          </button>
        </form>
      </div>
    </div>
  );
}
