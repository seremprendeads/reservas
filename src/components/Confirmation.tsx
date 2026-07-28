import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, Clock, Mail, Copy, Check, Download } from 'lucide-react';
import { useBooking } from '../contexts/BookingContext';
import { useBusiness } from '../contexts/BusinessContext';
import { supabase } from '../lib/supabase';
import { buildGoogleCalendarUrl, buildICSFile } from '../lib/calendar-utils';

export function Confirmation() {
  const { bookingData, resetBooking } = useBooking();
  const { business } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (bookingData.bookingCode) {
      sendConfirmationEmail();
      setEmailSent(true);
    }
  }, [bookingData.bookingCode]); // eslint-disable-line react-hooks/exhaustive-deps

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
          serviceName: bookingData.service?.name || '',
          businessName: business?.name || '',
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

  const dateStr = bookingData.date
    ? bookingData.date.toISOString().split('T')[0]
    : '';

  const dateDisplay = bookingData.date?.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const calendarTitle = `${bookingData.service?.name || 'Reserva'} - ${bookingData.name}`;
  const calendarDescription = [
    `Reserva: ${bookingData.bookingCode}`,
    `Cliente: ${bookingData.name}`,
    `Telefono: ${bookingData.phone}`,
    bookingData.service?.name ? `Servicio: ${bookingData.service.name}` : '',
    business?.name ? `Lugar: ${business.name}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  const calendarUrl = dateStr
    ? buildGoogleCalendarUrl({
        title: calendarTitle,
        date: dateStr,
        time: bookingData.time || '09:00',
        durationMinutes: 60,
        description: calendarDescription.replace(/\\n/g, '\n'),
        location: business?.name || '',
      })
    : '#';

  const handleDownloadICS = () => {
    if (!dateStr) return;
    buildICSFile({
      title: calendarTitle,
      date: dateStr,
      time: bookingData.time || '09:00',
      durationMinutes: 60,
      description: calendarDescription.replace(/\\n/g, '\n'),
      location: business?.name || '',
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.05)] p-8 text-center">
        <div className="w-20 h-20 bg-booking-primary-light rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-10 h-10 text-booking-primary" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4 font-display">
          Reserva confirmada
        </h1>

        <p className="text-gray-600 mb-8">
          Tu turno ha sido reservado exitosamente. Guarda tu codigo de reserva.
        </p>

        <div className="bg-booking-primary-light rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl hover:bg-booking-primary-light transition-all duration-200"
            >
              <span className="text-2xl font-bold text-booking-primary font-mono">
                {bookingData.bookingCode}
              </span>
              {copied ? (
                <Check className="w-5 h-5 text-booking-primary" />
              ) : (
                <Copy className="w-5 h-5 text-booking-primary" />
              )}
            </button>
          </div>

          <div className="space-y-3 text-left">
            {dateDisplay && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-booking-primary" />
                <span className="text-gray-800">{dateDisplay}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-booking-primary" />
              <span className="text-gray-800">{bookingData.time} hs</span>
            </div>
            {bookingData.service?.name && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-booking-primary" />
                <span className="text-gray-800">{bookingData.service.name}</span>
              </div>
            )}
            {business?.name && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-booking-primary" />
                <span className="text-gray-800">{business.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Add to Calendar buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm
              bg-white border-2 border-gray-200 text-gray-700
              hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50
              transition-all duration-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Agregar a Google Calendar
          </a>
          <button
            onClick={handleDownloadICS}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm
              bg-white border-2 border-gray-200 text-gray-700
              hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50
              transition-all duration-200"
          >
            <Download className="w-5 h-5 shrink-0" />
            Descargar evento (.ics)
          </button>
        </div>

        {emailSent && (
          <div className="flex items-center justify-center gap-2 text-booking-primary mb-6">
            <Mail className="w-5 h-5" />
            <span>Se ha enviado una confirmacion a {bookingData.email}</span>
          </div>
        )}

        <button
          onClick={resetBooking}
          className="w-full py-4 bg-booking-primary text-white rounded-xl font-semibold text-lg
            hover:bg-booking-primary-hover transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  );
}
