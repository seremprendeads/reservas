export const AI_CREDIT_COSTS = {
  LANDING_GENERATION: 5,
  HERO_REWRITE: 1,
  ABOUT_REWRITE: 1,
  SERVICES_REWRITE: 1,
  TESTIMONIALS_GENERATE: 1,
  FAQ_GENERATION: 1,
  SEO_GENERATION: 1,
  TEXT_REWRITE: 1,
  SECTION_REGENERATE: 1,
} as const;

export const PLAN_CREDITS: Record<string, number> = {
  free: 0,
  starter: 10,
  pro: 15,
  enterprise: 50,
};

export const LOW_CREDITS_THRESHOLD = 3;

export const LANDING_SECTIONS = [
  { key: 'hero', label: 'Hero', icon: 'Sparkles', cost: AI_CREDIT_COSTS.HERO_REWRITE },
  { key: 'about', label: 'Sobre nosotros', icon: 'Info', cost: AI_CREDIT_COSTS.ABOUT_REWRITE },
  { key: 'services', label: 'Servicios', icon: 'Wrench', cost: AI_CREDIT_COSTS.SERVICES_REWRITE },
  { key: 'testimonials', label: 'Testimonios', icon: 'Star', cost: AI_CREDIT_COSTS.TESTIMONIALS_GENERATE },
  { key: 'faq', label: 'Preguntas frecuentes', icon: 'HelpCircle', cost: AI_CREDIT_COSTS.FAQ_GENERATION },
  { key: 'cta', label: 'Call to Action', icon: 'MousePointerClick', cost: AI_CREDIT_COSTS.TEXT_REWRITE },
] as const;

export type LandingSectionKey = typeof LANDING_SECTIONS[number]['key'];

export const DEFAULT_SECTIONS = {
  hero: {
    title: '',
    subtitle: '',
    cta_text: 'Reservá tu turno',
    image_url: null as string | null,
  },
  about: {
    title: 'Sobre nosotros',
    description: '',
    image_url: null as string | null,
  },
  services: {
    title: 'Nuestros servicios',
    items: [] as { name: string; description: string; price: string }[],
  },
  testimonials: {
    title: 'Lo que dicen nuestros clientes',
    items: [] as { name: string; text: string; rating: number }[],
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [] as { question: string; answer: string }[],
  },
  cta: {
    title: '¿Listo para reservar?',
    description: 'Agendá tu turno ahora y experience la diferencia.',
    button_text: 'Reservar ahora',
  },
};

export const DEFAULT_THEME = {
  primary_color: '#059669',
  bg_color: '#ffffff',
  text_color: '#111827',
  muted_color: '#6b7280',
  section_padding: 'py-16',
  font_heading: 'Geist',
  font_body: 'Inter',
};
