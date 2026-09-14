import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ModuleId } from '../types';
import { PLAN_CARDS, linkDePlan, nivelActual } from '../lib/plans';

// ============================================================================
// Popup de planes.
//
// Cuándo se muestra (lo decide AdminPage):
//   · En prueba, del dia 5 en adelante → una vez por sesion
//   · Prueba vencida sin plan (free)   → siempre al abrir (alwaysShow)
//   · Con un plan pago                 → no se muestra; ahi va el UpgradeBanner
//
// En prueba y en free se ofrecen los cinco planes: el negocio no tiene ninguno
// contratado. El catalogo y los enlaces viven en ../lib/plans.ts
//
// Estilo: mismo lenguaje visual que la barra del contador (TrialBanner) —
// degradado naranja → violeta, texto blanco, tarjetas de vidrio (blanco
// translucido) y boton rojo. Los colores propios de cada plan (p.bg, p.border,
// p.button) quedan como acento fino en el borde superior de cada tarjeta.
// ============================================================================

const SESSION_KEY = 'bb_upgrade_popup_seen';

interface UpgradePopupProps {
  enabledModules: ModuleId[];
  isFreePlan: boolean;
  isTrial?: boolean;
  /** Ignora el "una vez por sesion": se muestra en cada ingreso al panel. */
  alwaysShow?: boolean;
}

export function UpgradePopup({
  enabledModules,
  isFreePlan,
  isTrial = false,
  alwaysShow = false,
}: UpgradePopupProps) {
  const [open, setOpen] = useState(false);

  const options = PLAN_CARDS.filter((p) => p.level > nivelActual(enabledModules, isFreePlan, isTrial));

  useEffect(() => {
    if (options.length === 0) return;
    if (!alwaysShow) {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return;
      } catch { /* si no hay sessionStorage, se muestra igual */ }
    }
    setOpen(true);
  }, [options.length, alwaysShow]);

  const close = () => {
    setOpen(false);
    if (alwaysShow) return; // en free vuelve a aparecer en el proximo ingreso
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignorar */ }
  };

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || options.length === 0) return null;

  const titulo = isTrial ? 'Tu prueba tiene fecha de vencimiento' : 'Tu plan puede crecer';
  const bajada = isTrial
    ? 'Cuando termine la prueba, tu cuenta pasa al plan gratuito. Elegí con cuál seguir y te contamos cómo activarlo.'
    : 'Elegí la opción que mejor te sirva y te contamos cómo activarla.';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Planes disponibles"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gradient-to-br from-orange-500 via-purple-600 to-violet-600 p-6 shadow-[0_8px_30px_rgba(0,0,0,.35)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-white">{titulo}</h2>
            <p className="mt-1 text-sm text-white/75">{bajada}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="-mr-2 -mt-2 shrink-0 rounded-full p-2 text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {options.map((p) => (
            <div
              key={p.key}
              className="flex flex-col overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm"
            >
              <div className="h-1 w-full" style={{ backgroundColor: p.button }} />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-sm font-semibold leading-snug text-white">{p.name}</p>
                <p className="mt-1 mb-4 flex-1 text-xs leading-5 text-white/70">{p.detail}</p>
                <a
                  href={linkDePlan(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500 bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
                >
                  Lo quiero
                </a>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-5 w-full rounded-xl border border-white/30 px-4 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {isTrial ? 'Seguir probando' : 'Seguir con mi plan actual'}
        </button>
      </div>
    </div>
  );
}