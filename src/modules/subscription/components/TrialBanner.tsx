import { Clock } from 'lucide-react';
import { whatsappLink } from '../lib/plans';
import { TRIAL_DAYS } from '../lib/constants';

// ============================================================================
// Contador del período de prueba.
//
// Vivía dentro de DashboardView, así que solo se veía en la pantalla Principal.
// Se movió a AdminPage para que acompañe al cliente en TODAS las secciones
// del panel durante los 16 días.
//
// Ahora se monta ARRIBA del AdminHeader como barra fina de ancho completo:
// una sola fila (icono + texto + contador + botón) y el progreso del trial
// como línea de 3px al pie de la barra. Como el scroll vive en <main>, la
// barra queda siempre visible sin necesidad de position: fixed.
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

  const units = [
    { val: days, label: 'd' },
    { val: hours, label: 'h' },
    { val: minutes, label: 'm' },
    { val: seconds, label: 's' },
  ];

  return (
    <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-orange-500 via-purple-600 to-violet-600">
      <div className="relative flex h-11 items-center gap-2 px-3 sm:gap-3 lg:px-8">
        <Clock className="h-4 w-4 shrink-0 text-white/80" />

        <p className="shrink-0 text-[11px] font-bold text-white sm:text-xs">
          Prueba<span className="hidden sm:inline"> de {TRIAL_DAYS} días</span>
        </p>

        <span className="hidden truncate text-[11px] text-white/70 md:inline">
          {isUrgent ? '¡Quedan pocos días!' : 'Disfrutá todas las funcionalidades'}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          {units.map(({ val, label }) => (
            <span
              key={label}
              className="inline-flex items-baseline rounded-md bg-red-600 px-1.5 py-0.5 text-[13px] font-bold tabular-nums text-white shadow-sm shadow-red-900/30 sm:text-sm"
            >
              {pad(val)}
              <span className="ml-0.5 text-[9px] font-medium text-white/70">{label}</span>
            </span>
          ))}
        </div>

        <a
          href={whatsappLink('Hola! Estoy en la prueba de BioWebLink y quiero consultar por los planes.')}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-red-500 bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.97] sm:px-4 sm:text-xs"
        >
          <span className="hidden sm:inline">Actualizar plan</span>
          <span className="sm:hidden">Plan</span>
        </a>
      </div>

      <div
        className="absolute bottom-0 left-0 h-[3px] w-full bg-white/10"
        title={`Progreso del trial: ${Math.round(progress)}%`}
      >
        <div
          className="h-full bg-white/70 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}