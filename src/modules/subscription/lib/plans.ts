// ============================================================================
// Catálogo comercial de planes — fuente única.
//
// Antes esto estaba duplicado en UpgradePopup.tsx y UpgradeBanner.tsx, con el
// riesgo de que se fueran desincronizando. Cualquier cambio de nombre, texto,
// color o enlace de contratación se hace ACÁ y lo toman los dos componentes.
// ============================================================================

// WhatsApp comercial de SerEmprende (formato internacional, sin + ni espacios).
export const SUPPORT_WHATSAPP = '5491130207987';

export function whatsappLink(mensaje: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

export type PlanCard = {
  key: string;
  level: number;
  name: string;
  detail: string;
  bg: string;
  border: string;
  button: string;
};

// Escalera de planes. 'level' define cuáles se ofrecen: solo los de nivel mayor
// al que el negocio ya tiene.
export const PLAN_CARDS: PlanCard[] = [
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

// Enlaces de contratación propios de cada plan (ej: link de pago de Mercado Pago).
// Mientras estén vacíos, el botón abre WhatsApp con el nombre del plan en el mensaje.
// Para activar el cobro directo: pegar acá el link de MP del plan correspondiente.
export const PLAN_LINKS: Record<string, string> = {
  bio_pro: '',
  bio_reservas: '',
  bio_reservas_web: '',
  enterprise: '',
  whatsapp: '',
};

// Siempre devuelve un enlace utilizable: el propio del plan si está cargado,
// y si no, WhatsApp con el plan ya escrito en el mensaje.
export function linkDePlan(plan: PlanCard): string {
  return PLAN_LINKS[plan.key] || whatsappLink(`Hola! Quiero contratar el plan: ${plan.name}`);
}

// Nivel comercial que tiene hoy el negocio.
// En prueba y en plan gratuito devuelve 0 a propósito: el negocio no "tiene"
// ningún plan contratado, así que se le ofrecen los cinco.
export function nivelActual(
  enabledModules: readonly string[],
  isFreePlan: boolean,
  isTrial: boolean
): number {
  if (isFreePlan || isTrial) return 0;
  if (enabledModules.includes('shop')) return 4;
  if (enabledModules.includes('landing')) return 3;
  if (enabledModules.includes('reservas')) return 2;
  return 1;
}
