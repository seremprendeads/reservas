import type { LandingTemplate, LandingSections, LandingTheme } from './types';

export const TEMPLATES: { id: LandingTemplate; name: string; description: string; icon: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Vercel / Linear. Ideal para desarrolladores, abogados, arquitectos.', icon: '◆' },
  { id: 'professional', name: 'Profesional', description: 'Médicos, odontólogos, psicólogos y terapeutas.', icon: '●' },
  { id: 'creative', name: 'Creativa', description: 'Tatuadores, fotógrafos, artistas y diseñadores.', icon: '▲' },
  { id: 'wellness', name: 'Wellness', description: 'Spa, centros de estética, gimnasios y bienestar.', icon: '◎' },
];

export const AVAILABLE_FONTS = [
  { id: 'Geist', label: 'Geist' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Manrope', label: 'Manrope' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { id: 'Instrument Sans', label: 'Instrument Sans' },
];

export const DEFAULT_SECTIONS: LandingSections = {
  header: {
    menu_items: [
      { label: 'Inicio', href: '#inicio' },
      { label: 'Nosotros', href: '#nosotros' },
      { label: 'Servicios', href: '#servicios' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Contacto', href: '#contacto' },
    ],
    cta_text: 'Reservar Turno',
  },
  hero: {
    title: 'Tu negocio de confianza',
    subtitle: 'Descripción breve de tu negocio. Lo que hacemos y por qué somos diferentes.',
    cta_text: 'Reservar Turno',
    cta_secondary_text: 'Conocer más',
    image_url: null,
    presentation_image_url: null,
    overlay_opacity: 40,
  },
  about: {
    title: 'Sobre nosotros',
    description: 'Contá tu historia, tu trayectoria y lo que te hace único. Esta sección genera confianza en tus potenciales clientes.',
    image_url: null,
  },
  main_service: {
    icon: 'Star',
    title: 'Nuestro servicio principal',
    description: 'Describí el servicio estrella de tu negocio. Explicá qué lo hace especial y por qué los clientes lo eligen.',
  },
  secondary_services: {
    title: 'Otros servicios',
    items: [
      { icon: 'Wrench', title: 'Servicio 1', description: 'Descripción del servicio' },
      { icon: 'Palette', title: 'Servicio 2', description: 'Descripción del servicio' },
      { icon: 'Zap', title: 'Servicio 3', description: 'Descripción del servicio' },
    ],
  },
  why_choose_us: {
    title: '¿Por qué elegirnos?',
    items: [
      { icon: 'Shield', text: 'Profesionales certificados' },
      { icon: 'Clock', text: 'Trámites ágiles y rápidos' },
      { icon: 'Heart', text: 'Atención personalizada' },
      { icon: 'Award', text: 'Años de experiencia' },
    ],
  },
  gallery: {
    title: 'Galería',
    images: [],
  },
  testimonials: {
    title: 'Lo que dicen nuestros clientes',
    items: [],
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [],
  },
  cta: {
    title: '¿Listo para reservar?',
    description: 'Agendá tu turno ahora y experience la diferencia.',
    button_text: 'Reservar Turno',
    button_action: 'booking',
  },
  footer: {
    address: '',
    phone: '',
    email: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    copyright: '',
  },
};

export const DEFAULT_THEME: LandingTheme = {
  primary_color: '#059669',
  secondary_color: '#10b981',
  bg_color: '#ffffff',
  text_color: '#111827',
  button_color: '#059669',
  footer_bg_color: '#111827',
  footer_text_color: '#f3f4f6',
  font_heading: 'Geist',
  font_body: 'Inter',
};

export const TEMPLATE_STYLES: Record<LandingTemplate, {
  cardRadius: string;
  sectionSpacing: string;
  headerStyle: 'solid' | 'transparent' | 'gradient';
  heroLayout: 'centered' | 'split' | 'full';
  cardShadow: string;
  buttonRadius: string;
}> = {
  minimal: {
    cardRadius: 'rounded-none',
    sectionSpacing: 'py-20',
    headerStyle: 'solid',
    heroLayout: 'centered',
    cardShadow: '',
    buttonRadius: 'rounded-none',
  },
  professional: {
    cardRadius: 'rounded-xl',
    sectionSpacing: 'py-20',
    headerStyle: 'solid',
    heroLayout: 'centered',
    cardShadow: 'shadow-lg',
    buttonRadius: 'rounded-lg',
  },
  creative: {
    cardRadius: 'rounded-2xl',
    sectionSpacing: 'py-24',
    headerStyle: 'transparent',
    heroLayout: 'split',
    cardShadow: 'shadow-xl',
    buttonRadius: 'rounded-full',
  },
  wellness: {
    cardRadius: 'rounded-2xl',
    sectionSpacing: 'py-20',
    headerStyle: 'gradient',
    heroLayout: 'centered',
    cardShadow: 'shadow-md',
    buttonRadius: 'rounded-full',
  },
};
