import { useState, useEffect } from 'react';

const STORAGE_KEY = 'suspended_deadline';

function getDeadline(): Date {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return new Date(stored);
  const deadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_KEY, deadline.toISOString());
  return deadline;
}

interface SuspendedScreenProps {
  message: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  paymentButtonUrl?: string;
}

export function SuspendedScreen({ message, supportWhatsapp, supportEmail, paymentButtonUrl }: SuspendedScreenProps) {
  const [countdown, setCountdown] = useState({ days: 15, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const deadline = getDeadline();
    const tick = () => {
      const diff = Math.max(0, deadline.getTime() - Date.now());
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="font-display mb-3 text-center text-xl font-semibold text-gray-900">
          Suscripción suspendida
        </h2>
        <p className="mb-4 text-center text-sm leading-relaxed text-gray-500">
          {message}
        </p>
        {countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0 ? (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2">
              {[
                { val: countdown.days, label: 'Días' },
                { val: countdown.hours, label: 'Horas' },
                { val: countdown.minutes, label: 'Min' },
                { val: countdown.seconds, label: 'Seg' },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-600 text-white text-lg font-bold tabular-nums shadow-lg">
                    {pad(val)}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-red-500">
              Quedan {countdown.days} días para renovar, de lo contrario se eliminarán todos tus datos.
            </p>
          </div>
        ) : (
          <p className="mb-6 text-center text-xs font-semibold text-red-500">
            El plazo venció. Todos tus datos serán eliminados.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <a
            href={paymentButtonUrl || '#prices'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-6 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-200 hover:from-red-700 hover:to-orange-600 hover:shadow-xl active:scale-[0.97]"
          >
            Actualizar Plan
          </a>
          {supportWhatsapp && (
            <a
              href={`https://wa.me/${supportWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-green-500 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-600"
            >
              Contactar por WhatsApp
            </a>
          )}
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
            >
              Enviar email
            </a>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by <span className="font-bold">Bookingbio</span>
        </p>
      </div>
    </div>
  );
}
