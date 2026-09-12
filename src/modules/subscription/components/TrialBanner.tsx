import { Clock } from 'lucide-react';
import { whatsappLink } from '../lib/plans';
import { TRIAL_DAYS } from '../lib/constants';

// ============================================================================
// Contador del período de prueba.
//
// Vivía dentro de DashboardView, así que solo se veía en la pantalla Principal.
// Se movió acá para montarlo en AdminPage y que acompañe al cliente en TODAS
// las secciones del panel durante los 18 días.
//
// El botón abre WhatsApp con SerEmprende. Antes apuntaba a href="#prices",
// un ancla a una sección que no existe: no hacía nada.
// ============================================================================

interface TrialBannerProps {
  trialCountdown: { days: number; hours: number; minutes: number; seconds: number };
}

export function TrialBanner({ trialCountdown }: TrialBannerProps) {
  const { days, hours, minutes, seconds } = trialCountdown;

  if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) return null;

  const isUrgent = days <= 2;
  const totalTrialMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const remainingMs = days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
  const progress = Math.max(0, Math.min(100, ((totalTrialMs - remainingMs) / totalTrialMs) * 100));

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-lg mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-600 to-violet-600" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMC00djItSDJ2MmgzNG0wLTR2MkgydjJoMzRtMC00djJIMnYyaDM0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      <div className="relative p-4 sm:p-6 md:p-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm">
              <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90">
                Período de prueba · {TRIAL_DAYS} días
              </p>
              <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1">
                {isUrgent ? '¡Quedan pocos días!' : 'Disfrutá todas las funcionalidades'}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                {[
                  { val: days, label: 'D' },
                  { val: hours, label: 'H' },
                  { val: minutes, label: 'M' },
                  { val: seconds, label: 'S' },
                ].map(({ val, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-red-600 text-white text-lg sm:text-xl md:text-2xl font-bold tabular-nums shadow-lg shadow-red-900/30">
                      {pad(val)}
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-medium text-white/60 mt-1 sm:mt-1.5 uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <a
            href={whatsappLink('Hola! Estoy en la prueba de BookingBio y quiero consultar por los planes.')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 sm:px-8 py-3 text-sm font-bold uppercase tracking-wider text-white bg-red-600 border border-red-500 shadow-lg hover:bg-red-700 transition-all duration-200 hover:shadow-xl active:scale-[0.97]"
          >
            Actualizar Plan
          </a>
        </div>
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-medium text-white/50 uppercase tracking-wider">Progreso del trial</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-white/70">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 sm:h-2 w-full rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/80 to-white/50 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
