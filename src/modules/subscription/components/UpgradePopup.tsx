import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ModuleId } from '../types';

// ============================================================================
// Popup de planes superiores. Se muestra una vez por sesión al entrar al panel.
// Los enlaces de contratación se cargan en PLAN_LINKS (por ahora vacíos:
// mientras estén vacíos, el botón usa el enlace de contacto general).
// ============================================================================

export const PLAN_LINKS: Record<string, string> = {
  bio_pro: '',
  bio_reservas: '',
  bio_reservas_web: '',
  enterprise: '',
  whatsapp: '',
};

const SESSION_KEY = 'bb_upgrade_popup_seen';

type PlanCard = {
  key: string;
  level: number;
  name: string;
  detail: string;
  bg: string;
  border: string;
  button: string;
};

const PLAN_CARDS: PlanCard[] = [
  {
    key: 'bio_pro',
    level: 1,
    name: 'Bio Pro',
    detail: 'Enlaces ilimitados, foto de perfil, imagen de fondo y redes sociales.',
    bg: '#EAF4FF', border: '#C6E0FA', button: '#2F6FA8',
  },
  {
    key: 'bio_reservas',
    level: 2,
    name: 'Bio Pro + Reservas + Pagos online',
    detail: 'Agenda de turnos, clientes, lista de espera y cobro online.',
    bg: '#FFF3E4', border: '#FADCBC', button: '#B4702A',
  },
  {
    key: 'bio_reservas_web',
    level: 3,
    name: 'Bio Pro + Reservas + Sitio web',
    detail: 'Sumá tu página completa con servicios, galería y contacto.',
    bg: '#EDF3E8', border: '#D2E3C7', button: '#4F7340',
  },
  {
    key: 'enterprise',
    level: 4,
    name: 'Bio Pro + Reservas + Sitio web + Tienda Simple + Pagos online',
    detail: 'Vendé productos online y sumá las herramientas de posicionamiento.',
    bg: '#F3EDFB', border: '#DECFF0', button: '#6B4E9B',
  },
  {
    key: 'whatsapp',
    level: 5,
    name: 'Todo + WhatsApp automatizado',
    detail: 'Confirmaciones y recordatorios que salen solos, también fines de semana.',
    bg: '#FDEEF0', border: '#F7D2D8', button: '#A84257',
  },
];

// Nivel que tiene hoy el negocio. En plan gratuito es 0: se ofrecen todos.
function currentLevel(enabledModules: ModuleId[], isFreePlan: boolean): number {
  if (isFreePlan) return 0;
  if (enabledModules.includes('shop')) return 4;
  if (enabledModules.includes('landing')) return 3;
  if (enabledModules.includes('reservas')) return 2;
  return 1;
}

interface UpgradePopupProps {
  enabledModules: ModuleId[];
  isFreePlan: boolean;
  supportUrl?: string;
}

export function UpgradePopup({ enabledModules, isFreePlan, supportUrl }: UpgradePopupProps) {
  const [open, setOpen] = useState(false);

  const options = PLAN_CARDS.filter((p) => p.level > currentLevel(enabledModules, isFreePlan));

  // Una sola vez por sesión: al cerrarlo no vuelve a aparecer hasta el próximo ingreso.
  useEffect(() => {
    if (options.length === 0) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch { /* si no hay sessionStorage, se muestra igual */ }
    setOpen(true);
  }, [options.length]);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignorar */ }
  };

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || options.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Planes disponibles"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,.12)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-gray-900">Tu plan puede crecer</h2>
            <p className="mt-1 text-sm text-gray-500">
              Elegí la opción que mejor te sirva y te contamos cómo activarla.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="-mr-2 -mt-2 shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {options.map((p) => {
            const href = PLAN_LINKS[p.key] || supportUrl;
            return (
              <div
                key={p.key}
                className="flex flex-col rounded-xl border p-4"
                style={{ backgroundColor: p.bg, borderColor: p.border }}
              >
                <p className="text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
                <p className="mt-1 mb-4 flex-1 text-xs leading-5 text-gray-600">{p.detail}</p>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ backgroundColor: p.button }}
                  >
                    Lo quiero
                  </a>
                ) : (
                  <span className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white opacity-60" style={{ backgroundColor: p.button }}>
                    Próximamente
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={close}
          className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Seguir con mi plan actual
        </button>
      </div>
    </div>
  );
}
