import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, Mail, Copy, Check } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { supabase } from '../lib/supabase';

export function Confirmation() {
  const { bookingData, resetBooking } = useBooking();
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (bookingData.bookingCode) {
      sendConfirmationEmail();
      setEmailSent(true);
    }
  }, [bookingData.bookingCode]);

  const sendConfirmationEmail = async () => {
    try {
      await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: bookingData.email,
          name: bookingData.name,
          bookingCode: bookingData.bookingCode,
          date: bookingData.date?.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          time: bookingData.time,
        },
      });
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };

  const copyCode = () => {
    if (bookingData.bookingCode) {
      navigator.clipboard.writeText(bookingData.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Reserva confirmada
        </h1>

        <p className="text-gray-600 mb-8">
          Tu turno ha sido reservado exitosamente. Guarda tu codigo de reserva.
        </p>

        <div className="bg-emerald-50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <span className="text-2xl font-bold text-emerald-600 font-mono">
                {bookingData.bookingCode}
              </span>
              {copied ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5 text-emerald-600" />
              )}
            </button>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-700">{bookingData.date?.toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-gray-700">{bookingData.time} hs</span>
            </div>
          </div>
        </div>

        {emailSent && (
          <div className="flex items-center justify-center gap-2 text-emerald-600 mb-6">
            <Mail className="w-5 h-5" />
            <span>Se ha enviado una confirmacion a {bookingData.email}</span>
          </div>
        )}

        <button
          onClick={resetBooking}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg
            hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  );
}
