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

// Landing de venta de BiowebLink (armada con la propia Landing Page del
// producto, negocio "bioweblink", que ahora vive en la raiz de bioweblink.com),
// sección Planes. En vez de mandar directo a WhatsApp con un solo plan
// sugerido, se manda acá para que el negocio vea todos los planes y elija —
// el botón "Consultar" de cada uno ya abre WhatsApp con el nombre del plan
// elegido.
export const PLANS_PAGE_URL = 'https://bioweblink.com#planes';

export type PlanCard = {
  key: string;
  level: number;
  name: string;
  detail: string;
  // Módulos que otorga este plan. No se importa de constants.ts (PLAN_MODULES)
  // para evitar un import circular: constants.ts ya importa de este archivo.
  modules: string[];
  bg: string;
  border: string;
  button: string;
};

// Escalera de planes. A partir del 4 y el 6 hay dos ramas paralelas (con y sin
// Reservas) en vez de una escalera puramente lineal — ver nivelActual() más
// abajo, que compara por módulos y no asume un orden estrictamente creciente.
export const PLAN_CARDS: PlanCard[] = [
  {
    key: 'bio_pro',
    level: 1,
    name: 'Bio Pro',
    detail: 'Enlaces ilimitados, foto de perfil, imagen de fondo y redes sociales.',
    modules: ['bio'],
    bg: '#EAF4FF', border: '#C6E0FA', button: '#2F6FA8',
  },
  {
    key: 'bio_reservas',
    level: 2,
    name: 'Bio Pro + Reservas + Pagos online',
    detail: 'Agenda de turnos, clientes, lista de espera y cobro online.',
    modules: ['bio', 'reservas'],
    bg: '#FFF3E4', border: '#FADCBC', button: '#B4702A',
  },
  {
    key: 'bio_web',
    level: 3,
    name: 'Bio Pro + Sitio web',
    detail: 'Sumá tu página completa con servicios, galería y contacto (sin agenda de turnos).',
    modules: ['bio', 'landing'],
    bg: '#FFF9E6', border: '#F5E6B8', button: '#A88A2A',
  },
  {
    key: 'bio_reservas_web',
    level: 4,
    name: 'Bio Pro + Reservas + Sitio web',
    detail: 'Sumá tu página completa con servicios, galería y contacto.',
    modules: ['bio', 'reservas', 'landing'],
    bg: '#EDF3E8', border: '#D2E3C7', button: '#4F7340',
  },
  {
    key: 'bio_web_shop',
    level: 5,
    name: 'Bio Pro + Sitio web + Tienda Simple',
    detail: 'Vendé productos online desde tu sitio (sin agenda de turnos).',
    modules: ['bio', 'landing', 'shop'],
    bg: '#E8F5F2', border: '#C7E5DE', button: '#357A68',
  },
  {
    key: 'enterprise',
    level: 6,
    name: 'Todo incluido completo',
    detail: 'Reservas, sitio web, tienda simple, pagos online y herramientas de posicionamiento.',
    modules: ['bio', 'landing', 'reservas', 'shop', 'seo', 'landing_shop'],
    bg: '#F3EDFB', border: '#DECFF0', button: '#6B4E9B',
  },
  {
    key: 'whatsapp',
    level: 7,
    name: 'Automatización de WhatsApp',
    detail: 'Confirmaciones y recordatorios que salen solos, también fines de semana. Precio a convenir.',
    modules: ['bio', 'landing', 'reservas', 'shop', 'seo', 'landing_shop'],
    bg: '#FDEEF0', border: '#F7D2D8', button: '#A84257',
  },
];

// Enlaces de contratación propios de cada plan (ej: link de pago de Mercado Pago).
// Mientras estén vacíos, el botón abre WhatsApp con el nombre del plan en el mensaje.
// Para activar el cobro directo: pegar acá el link de MP del plan correspondiente.
// "whatsapp" (Automatización de WhatsApp) queda siempre por WhatsApp: es a
// convenir, no tiene precio fijo de catálogo.
export const PLAN_LINKS: Record<string, string> = {
  bio_pro: '',
  bio_reservas: '',
  bio_web: '',
  bio_reservas_web: '',
  bio_web_shop: '',
  enterprise: '',
};

// Siempre devuelve un enlace utilizable: el propio del plan si está cargado,
// y si no, WhatsApp con el plan ya escrito en el mensaje.
export function linkDePlan(plan: PlanCard): string {
  return PLAN_LINKS[plan.key] || whatsappLink(`Hola! Quiero contratar el plan: ${plan.name}`);
}

// Nivel comercial que tiene hoy el negocio.
// En prueba y en plan gratuito devuelve 0 a propósito: el negocio no "tiene"
// ningún plan contratado, así que se le ofrecen todos.
//
// Como ahora hay ramas paralelas (ej. "Sitio web" con o sin "Reservas"), el
// nivel no se puede inferir mirando un solo módulo a la vez: se compara contra
// los módulos que efectivamente otorga cada plan del catálogo y se toma el más
// alto que el negocio ya tiene por completo. Un plan superior (ej. Todo
// incluido) siempre contiene los módulos de los inferiores, así que esto
// resuelve bien tanto la escalera lineal como las ramas.
export function nivelActual(
  enabledModules: readonly string[],
  isFreePlan: boolean,
  isTrial: boolean
): number {
  if (isFreePlan || isTrial) return 0;
  let nivel = 0;
  for (const plan of PLAN_CARDS) {
    // "Automatización de WhatsApp" no se puede detectar por módulos: es a
    // convenir, no prende un módulo propio. Se ofrece siempre que el negocio
    // no llegó a ese nivel todavía, nunca se marca como "ya lo tiene".
    if (plan.key === 'whatsapp') continue;
    const tieneTodos = plan.modules.every((m) => enabledModules.includes(m));
    if (tieneTodos && plan.level > nivel) nivel = plan.level;
  }
  return nivel || 1;
}
