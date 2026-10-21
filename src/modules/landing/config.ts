import type { LandingTemplate, LandingSections, LandingTheme } from './types';
import { DEFAULT_DIVIDER_SHAPE, DIVIDER_DEFAULT_HEIGHT } from './lib/dividers';

export const TEMPLATES: { id: LandingTemplate; name: string; description: string; icon: string }[] = [
  { id: 'creative', name: 'Creativa', description: 'Tatuadores, fotógrafos, artistas y diseñadores.', icon: '▲' },
];

export const AVAILABLE_FONTS = [
  // Serif / editoriales — para un aire más refinado en los títulos
  { id: 'Fraunces', label: 'Fraunces (Serif editorial)' },
  { id: 'Playfair Display', label: 'Playfair Display (Serif elegante)' },
  { id: 'Cormorant Garamond', label: 'Cormorant Garamond (Serif delicada)' },
  { id: 'Libre Baskerville', label: 'Libre Baskerville (Serif clásica)' },
  { id: 'DM Serif Display', label: 'DM Serif Display (Serif con carácter)' },
  // Sans-serif — para cuerpo de texto o títulos más modernos
  { id: 'Geist', label: 'Geist' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Manrope', label: 'Manrope' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
  { id: 'Instrument Sans', label: 'Instrument Sans' },
  { id: 'Poppins', label: 'Poppins' },
  { id: 'Outfit', label: 'Outfit' },
  { id: 'Dancing Script', label: 'Dancing Script (Cursiva)' },
];

// Query string de Google Fonts (familia:peso) para cada tipografía disponible.
// Usado tanto por la landing pública (useLandingData) como por el selector de
// tipografía del editor (DesignTab), para que este último pueda cargar las
// fuentes y mostrar cada opción en su letra real.
export const FONT_GOOGLE_MAP: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700;800',
  'Manrope': 'Manrope:wght@400;500;600;700;800',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  'Instrument Sans': 'Instrument+Sans:wght@400;500;600;700;800',
  'Geist': 'Geist:wght@400;500;600;700;800',
  'Poppins': 'Poppins:wght@400;500;600;700;800',
  'Outfit': 'Outfit:wght@400;500;600;700;800',
  'Dancing Script': 'Dancing+Script:wght@400;500;600;700',
  'Fraunces': 'Fraunces:wght@400;500;600;700;800;900',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700;800;900',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  'DM Serif Display': 'DM+Serif+Display',
};

export function getGoogleFontsUrl(...fonts: string[]): string | null {
  const families = new Set<string>();
  for (const f of fonts) {
    const mapped = FONT_GOOGLE_MAP[f];
    if (mapped) families.add(mapped);
  }
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${[...families].map(f => `family=${f}`).join('&')}&display=swap`;
}

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
    logo_title: '',
    logo_description: '',
    logo_image_url: null,
    logo_shape: 'circle',
  },
  hero: {
    hero_template: 'centered',
    logo_url: null,
    logo_caption: '',
    title: 'Tu negocio de confianza',
    subtitle: 'Descripción breve de tu negocio. Lo que hacemos y por qué somos diferentes.',
    description: '',
    cta_text: 'Reservar Turno',
    cta_secondary_text: 'Conocer más',
    image_url: null,
    presentation_image_url: null,
    overlay_opacity: 40,
    primary_button_text: 'Reservar Turno',
    primary_button_url: '#contacto',
    secondary_button_text: 'Conocer más',
    secondary_button_url: '#nosotros',
    background_color: '#111827',
    background_image: null,
    cover_image: null,
    video_url: '',
    logo_caption_size: null,
    logo_caption_color: null,
    title_size: null,
    title_color: null,
    subtitle_size: null,
    subtitle_color: null,
    description_size: null,
    description_color: null,
  },
  about: {
    title: 'Sobre nosotros',
    subtitle: '',
    description: 'Contá tu historia, tu trayectoria y lo que te hace único. Esta sección genera confianza en tus potenciales clientes.',
    image_url: null,
    alignment: 'left',
    image_position: 'left',
  },
  about_text: {
    title: '',
    subtitle: '',
    text: '',
    alignment: 'left',
    image_url: null,
    image_position: 'left',
  },
  main_service: {
    icon: 'Star',
    title: 'Nuestro servicio principal',
    subtitle: '',
    description: 'Describí el servicio estrella de tu negocio. Explicá qué lo hace especial y por qué los clientes lo eligen.',
  },
  secondary_services: {
    title: 'Otros servicios',
    subtitle: '',
    items: [
      { icon: 'Wrench', image_url: null, title: 'Servicio 1', description: 'Descripción del servicio' },
      { icon: 'Palette', image_url: null, title: 'Servicio 2', description: 'Descripción del servicio' },
      { icon: 'Zap', image_url: null, title: 'Servicio 3', description: 'Descripción del servicio' },
    ],
  },
  why_choose_us: {
    title: '¿Por qué elegirnos?',
    subtitle: '',
    items: [
      { icon: 'Shield', text: 'Profesionales certificados' },
      { icon: 'Clock', text: 'Trámites ágiles y rápidos' },
      { icon: 'Heart', text: 'Atención personalizada' },
      { icon: 'Award', text: 'Años de experiencia' },
    ],
  },
  gallery: {
    title: 'Galería',
    subtitle: '',
    images: [],
    overlay_color: '#111827',
  },
  banner: {
    title: 'Tu banner',
    subtitle: 'Texto del banner',
    description: '',
    image_url: null,
    overlay_color: '#111827',
    overlay_opacity: 60,
  },
  shop_invite: {
    title: 'Visitanos en nuestra Tienda',
    subtitle: 'Descubrí todos nuestros productos disponibles online',
    description: '',
    button_text: 'IR A LA TIENDA',
    image_url: null,
    overlay_color: '#111827',
    overlay_opacity: 60,
  },
  testimonials: {
    title: 'Lo que dicen nuestros clientes',
    subtitle: '',
    items: [],
    google_review_url: null,
  },
  faq: {
    title: 'Preguntas frecuentes',
    subtitle: '',
    items: [],
  },
  cta: {
    title: '¿Listo para reservar?',
    description: 'Agendá tu turno ahora y experience la diferencia.',
    button_text: 'Reservar Turno',
    button_action: 'booking',
    image_url: null,
    overlay_color: '#111827',
    overlay_opacity: 70,
  },
  plans: {
    title: 'Elegí tu plan',
    items: [],
  },
  map: {
    title: '¿Dónde estamos?',
    subtitle: '',
    address: '',
    map_url: '',
  },
  popup: {
    enabled: false,
    title: '¡Oferta especial!',
    subtitle: 'No te pierdas nuestras promociones',
    description: 'Describí tu oferta o promoción especial para atraer más clientes.',
    button_text: 'Ver oferta',
    button_url: '#contacto',
    image_url: null,
    overlay_color: '#111827',
    overlay_opacity: 80,
  },
  seo_marketing: {
    general: {
      meta_title: '',
      meta_description: '',
      keywords: '',
      canonical_url: '',
      robots: 'index, follow',
      og_title: '',
      og_description: '',
      og_image: null,
      og_type: 'website',
      og_locale: 'es_AR',
      og_site_name: '',
    },
    social: {
      twitter_card: 'summary_large_image',
      twitter_site: '',
      twitter_creator: '',
      twitter_title: '',
      twitter_description: '',
      twitter_image: null,
      fb_app_id: '',
      fb_page_url: '',
      pinterest_description: '',
      linkedin_title: '',
      linkedin_description: '',
    },
    pixel_analytics: {
      google_analytics_id: '',
      google_tag_manager_id: '',
      facebook_pixel_id: '',
      tiktok_pixel_id: '',
      hotjar_id: '',
      custom_head_scripts: '',
      custom_body_scripts: '',
    },
    schema: {
      enabled: false,
      business_type: 'LocalBusiness',
      business_name: '',
      business_description: '',
      business_logo: null,
      business_url: '',
      business_phone: '',
      business_email: '',
      street_address: '',
      address_locality: '',
      address_region: '',
      postal_code: '',
      address_country: 'AR',
      price_range: '',
      opening_hours: '',
      social_profiles: '',
    },
    sitemap: {
      auto_generate: true,
      include_pages: '',
      change_freq: 'weekly',
      priority: '0.8',
      lastmod: '',
      custom_robots_rules: '',
    },
    verification: {
      google_search_console: '',
      bing_webmaster: '',
      yandex_webmaster: '',
      pinterest_verification: '',
      facebook_domain_verification: '',
      nordic_maze: '',
    },
    performance: {
      lazy_loading_images: true,
      preload_critical: true,
      minify_html: false,
      defer_js: false,
      image_quality: 80,
      max_image_width: 1920,
      cache_ttl: '1h',
      cdn_enabled: false,
    },
  },
  footer: {
    address: '',
    phone: '',
    whatsapp: '',
    whatsapp_floating_enabled: true,
    email: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    x: '',
    linkedin: '',
    youtube: '',
    copyright: '',
    logo_title: '',
    logo_description: '',
    frases: '',
  },
  dividers: {
    hero_about: {
      enabled: false,
      shape: DEFAULT_DIVIDER_SHAPE,
      height: DIVIDER_DEFAULT_HEIGHT,
      flip: false,
    },
    cta_footer: {
      enabled: false,
      shape: DEFAULT_DIVIDER_SHAPE,
      height: DIVIDER_DEFAULT_HEIGHT,
      flip: false,
    },
  },
};

/**
 * Mergea las secciones guardadas en la base con los valores por defecto.
 *
 * Las landings publicadas antes de que existieran los subtítulos (o cualquier
 * campo nuevo) guardan la sección sin ese campo. Si lo leyésemos tal cual,
 * el input del admin quedaría sin controlar y el color de la sección no
 * tendría a qué aplicarse. Mergear sección por sección completa los huecos
 * sin pisar lo que el negocio ya configuró.
 *
 * El Hero queda exceptuado: tiene su propia migración por plantilla
 * (hero_template) y mergearlo con los defaults le cambiaría la plantilla a
 * las landings viejas.
 */
export function mergeSections(loaded: Partial<LandingSections> | null | undefined): LandingSections {
  // Se mergea sección por sección y el contenido guardado puede venir de
  // versiones anteriores con otras formas, así que se accede de forma laxa.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = (loaded || {}) as any;
  return {
    ...DEFAULT_SECTIONS,
    ...src,
    header: { ...DEFAULT_SECTIONS.header, ...src.header },
    about: { ...DEFAULT_SECTIONS.about, ...src.about },
    about_text: { ...DEFAULT_SECTIONS.about_text, ...src.about_text },
    main_service: { ...DEFAULT_SECTIONS.main_service, ...src.main_service },
    secondary_services: { ...DEFAULT_SECTIONS.secondary_services, ...src.secondary_services },
    why_choose_us: { ...DEFAULT_SECTIONS.why_choose_us, ...src.why_choose_us },
    gallery: { ...DEFAULT_SECTIONS.gallery, ...src.gallery },
    testimonials: { ...DEFAULT_SECTIONS.testimonials, ...src.testimonials },
    faq: { ...DEFAULT_SECTIONS.faq, ...src.faq },
    banner: { ...DEFAULT_SECTIONS.banner, ...src.banner },
    shop_invite: { ...DEFAULT_SECTIONS.shop_invite, ...src.shop_invite },
    cta: { ...DEFAULT_SECTIONS.cta, ...src.cta },
    map: { ...DEFAULT_SECTIONS.map, ...src.map },
    popup: { ...DEFAULT_SECTIONS.popup, ...src.popup },
    footer: { ...DEFAULT_SECTIONS.footer, ...src.footer },
    plans: { ...DEFAULT_SECTIONS.plans, ...src.plans },
    hero: (src.hero || DEFAULT_SECTIONS.hero) as LandingSections['hero'],
    dividers: {
      hero_about: { ...DEFAULT_SECTIONS.dividers.hero_about, ...src.dividers?.hero_about },
      cta_footer: { ...DEFAULT_SECTIONS.dividers.cta_footer, ...src.dividers?.cta_footer },
    },
    seo_marketing: {
      ...DEFAULT_SECTIONS.seo_marketing,
      ...src.seo_marketing,
      general: { ...DEFAULT_SECTIONS.seo_marketing.general, ...src.seo_marketing?.general },
      social: { ...DEFAULT_SECTIONS.seo_marketing.social, ...src.seo_marketing?.social },
      pixel_analytics: { ...DEFAULT_SECTIONS.seo_marketing.pixel_analytics, ...src.seo_marketing?.pixel_analytics },
      schema: { ...DEFAULT_SECTIONS.seo_marketing.schema, ...src.seo_marketing?.schema },
      sitemap: { ...DEFAULT_SECTIONS.seo_marketing.sitemap, ...src.seo_marketing?.sitemap },
      verification: { ...DEFAULT_SECTIONS.seo_marketing.verification, ...src.seo_marketing?.verification },
      performance: { ...DEFAULT_SECTIONS.seo_marketing.performance, ...src.seo_marketing?.performance },
    },
  };
}

export const DEFAULT_THEME: LandingTheme = {
  primary_color: '#059669',
  secondary_color: '#10b981',
  bg_color: '#ffffff',
  text_color: '#111111',
  button_color: '#059669',
  footer_bg_color: '#111111',
  footer_text_color: '#f3f4f6',
  social_icon_color: '#a1a1aa',
  service_icon_color: '#059669',
  button_border_radius: 'rounded-xl',
  font_heading: 'Geist',
  font_body: 'Inter',
  font_heading_tracking: '',
  font_heading_line_height: '',
  font_body_tracking: '',
  font_body_line_height: '',
  about_bg_color: '#ffffff',
  main_service_bg_color: '#fafafa',
  secondary_services_card_bg_color: '#ffffff',
  why_choose_us_bg_color: '#fafafa',
  why_choose_us_card_bg_color: '#ffffff',
  why_choose_us_icon_color: '#059669',
  gallery_bg_color: '#ffffff',
  testimonials_bg_color: '#fafafa',
  testimonials_card_bg_color: '#ffffff',
  faq_bg_color: '#ffffff',
  faq_item_bg_color: '#ffffff',
  map_bg_color: '#ffffff',
  cta_bg_color: '#059669',
  plans_bg_color: '#ffffff',
  plans_card_bg_color: '#fafafa',
  divider_hero_about_color: '',
  divider_cta_footer_color: '',
};

export const TEMPLATE_STYLES: Record<LandingTemplate, {
  cardRadius: string;
  sectionSpacing: string;
  headerStyle: 'solid' | 'transparent' | 'gradient';
  heroLayout: 'centered' | 'split' | 'full';
  cardShadow: string;
  buttonRadius: string;
}> = {
  creative: {
    cardRadius: 'rounded-2xl',
    sectionSpacing: 'py-28 lg:py-32',
    headerStyle: 'transparent',
    heroLayout: 'split',
    cardShadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.05)]',
    buttonRadius: 'rounded-xl',
  },
};