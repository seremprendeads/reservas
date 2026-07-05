import { Calendar } from '../components/Calendar';
import { BookingForm } from '../components/BookingForm';
import { Payment } from '../components/Payment';
import { Confirmation } from '../components/Confirmation';
import { BookingProvider, useBooking } from '../contexts/BookingContext';
import { Clock, Phone, MapPin } from 'lucide-react';

function BookingContent() {
  const { step } = useBooking();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-300">Reserva tu Turno</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {['calendar', 'form', 'payment', 'confirmation'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step === s || ['calendar', 'form', 'payment', 'confirmation'].indexOf(step) > i
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-2 rounded
                  ${['calendar', 'form', 'payment', 'confirmation'].indexOf(step) > i
                    ? 'bg-emerald-600'
                    : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 text-sm text-gray-300 mb-8">
          <span className={step === 'calendar' ? 'font-semibold text-emerald-600' : ''}>
            Fecha y hora
          </span>
          <span className={step === 'form' ? 'font-semibold text-emerald-600' : ''}>
            Tus datos
          </span>
          <span className={step === 'payment' ? 'font-semibold text-emerald-600' : ''}>
            Pago
          </span>
          <span className={step === 'confirmation' ? 'font-semibold text-emerald-600' : ''}>
            Confirmacion
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        {step === 'calendar' && <Calendar />}
        {step === 'form' && <BookingForm />}
        {step === 'payment' && <Payment />}
        {step === 'confirmation' && <Confirmation />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 mt-auto py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Buenos Aires, Argentina</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            Pagos seguros con Mercado Pago 

          </p>
        </div>
      </footer>
    </div>
  );
}

export function BookingPage() {
  return (
    <BookingProvider>
      <BookingContent />
    </BookingProvider>
  );
}
