import { TRIAL_DAYS } from '../lib/constants';
import { whatsappLink } from '../lib/plans';

// ============================================================================
// Contador de la prueba gratuita, visible en el panel mientras está vigente.
//
// La duración sale de TRIAL_DAYS (18) y no de un número fijo acá: si el plazo
// comercial cambia, la barra de progreso lo acompaña sola.
// ============================================================================

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const usados = Math.max(0, TRIAL_DAYS - daysRemaining);
  const progress = Math.max(0, Math.min(100, (usados / TRIAL_DAYS) * 100));
  const porVencer = daysRemaining <= 5;

  const texto = daysRemaining === 1
    ? 'Te queda 1 día de prueba'
    : `Te quedan ${daysRemaining} días de prueba`;

  return (
    <div
      className={`mb-6 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200 ${
        porVencer
          ? 'bg-gradient-to-r from-amber-500 to-orange-600'
          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-white">
          {porVencer ? 'Tu prueba está por terminar' : 'Prueba gratuita'}
        </h3>
        <span className="font-display text-sm font-medium text-white/80">{texto}</span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-white/90">
        Cuando termine, tu cuenta pasa al plan gratuito y quedan activos solo tus Bio links.
      </p>

      <a
        href={whatsappLink('Hola! Estoy probando BookingBio y quiero consultar por los planes.')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-200 hover:bg-white/90"
      >
        Quiero seguir con un plan
      </a>
    </div>
  );
}
