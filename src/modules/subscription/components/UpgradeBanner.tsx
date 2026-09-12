import type { ModuleId } from '../types';

// ============================================================================
// Invitación a subir de plan.
// Muestra solo los planes superiores al que ya tiene el negocio.
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

type PlanCard = {
  key: string;
  level: number;
  name: string;
  detail: string;
  bg: string;
  border: string;
};

// Escalera de planes. 'level' define cuáles se ofrecen: solo los de nivel mayor
// al plan actual del negocio.
const PLAN_CARDS: PlanCard[] = [
  {
    key: 'bio_pro',
    level: 1,
    name: 'Bio Pro',
    detail: 'Enlaces ilimitados, foto de perfil, imagen de fondo y redes sociales.',
    bg: '#EAF4FF',
    border: '#C6E0FA',
  },
  {
    key: 'bio_reservas',
    level: 2,
    name: 'Bio Pro + Reservas + Pagos online',
    detail: 'Agenda de turnos, clientes, lista de espera y cobro online.',
    bg: '#FFF3E4',
    border: '#FADCBC',
  },
  {
    key: 'bio_reservas_web',
    level: 3,
    name: 'Bio Pro + Reservas + Sitio web',
    detail: 'Sumá tu página completa con servicios, galería y contacto.',
    bg: '#EDF3E8',
    border: '#D2E3C7',
  },
  {
    key: 'enterprise',
    level: 4,
    name: 'Bio Pro + Reservas + Sitio web + Tienda Simple + Pagos online',
    detail: 'Vendé productos online y sumá las herramientas de posicionamiento.',
    bg: '#F3EDFB',
    border: '#DECFF0',
  },
  {
    key: 'whatsapp',
    level: 5,
    name: 'Todo + WhatsApp automatizado',
    detail: 'Confirmaciones y recordatorios que salen solos, también fines de semana.',
    bg: '#FDEEF0',
    border: '#F7D2D8',
  },
];

// Nivel que tiene hoy el negocio, según los módulos habilitados.
function currentLevel(enabledModules: ModuleId[]): number {
  if (enabledModules.includes('shop')) return 4;
  if (enabledModules.includes('landing')) return 3;
  if (enabledModules.includes('reservas')) return 2;
  return 1;
}

interface UpgradeBannerProps {
  enabledModules: ModuleId[];
  supportUrl?: string;
}

export function UpgradeBanner({ enabledModules, supportUrl }: UpgradeBannerProps) {
  const level = currentLevel(enabledModules);
  const options = PLAN_CARDS.filter((p) => p.level > level);
  if (options.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg text-foreground">Tu plan puede crecer</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Elegí la opción que mejor te sirva y te contamos cómo activarla.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((p) => {
          const href = PLAN_LINKS[p.key] || supportUrl;
          const content = (
            <>
              <p className="text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">{p.detail}</p>
            </>
          );
          const className =
            'block rounded-xl border p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
          const style = { backgroundColor: p.bg, borderColor: p.border };

          return href ? (
            <a key={p.key} href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
              {content}
            </a>
          ) : (
            <div key={p.key} className={className} style={style}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}