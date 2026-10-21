import type { DividerShapeId } from './lib/dividers';

export type LandingTemplate = 'creative';

export interface LandingPage {
  id: string;
  business_id: string;
  slug: string;
  template: LandingTemplate;
  sections: LandingSections;
  theme: LandingTheme;
  status: 'draft' | 'published';
  visible_sections: string[];
  logo_url: string | null;
  seo: LandingSEO;
  created_at: string;
  updated_at: string;
}

/**
 * Configuración de un separador entre dos secciones.
 * Los colores NO se guardan acá: se derivan del theme en tiempo de render.
 */
export interface LandingDivider {
  enabled: boolean;
  shape: DividerShapeId;
  height: number;
  flip: boolean;
}

export interface LandingSections {
  header: {
    menu_items: { label: string; href: string }[];
    cta_text: string;
    logo_title: string;
    logo_description: string;
    logo_image_url: string | null;
    logo_shape: 'circle' | 'square';
  };
  hero: {
    hero_template: string;
    logo_url: string | null;
    logo_caption: string;
    title: string;
    subtitle: string;
    description: string;
    cta_text: string;
    cta_secondary_text: string;
    image_url: string | null;
    presentation_image_url: string | null;
    overlay_opacity: number;
    primary_button_text: string;
    primary_button_url: string;
    secondary_button_text: string;
    secondary_button_url: string;
    background_color: string;
    background_image: string | null;
    cover_image: string | null;
    video_url: string;
    logo_caption_size: number | null;
    logo_caption_color: string | null;
    title_size: number | null;
    title_color: string | null;
    subtitle_size: number | null;
    subtitle_color: string | null;
    description_size: number | null;
    description_color: string | null;
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    image_url: string | null;
    alignment: 'left' | 'center' | 'right' | 'justify';
    image_position: 'left' | 'right';
  };
  about_text: {
    title: string;
    subtitle: string;
    text: string;
    alignment: 'left' | 'center' | 'justify';
    image_url: string | null;
    image_position: 'left' | 'right';
  };
  main_service: {
    icon: string;
    title: string;
    subtitle: string;
    description: string;
  };
  secondary_services: {
    title: string;
    subtitle: string;
    items: { icon: string; image_url: string | null; title: string; description: string }[];
  };
  why_choose_us: {
    title: string;
    subtitle: string;
    items: { icon: string; title?: string; subtitle?: string; text: string }[];
  };
  gallery: {
    title: string;
    subtitle: string;
    images: { url: string; title: string; description: string }[];
    overlay_color: string;
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: { name: string; text: string; rating: number }[];
    google_review_url: string | null;
  };
  faq: {
    title: string;
    subtitle: string;
    items: { question: string; answer: string }[];
  };
  cta: {
    title: string;
    description: string;
    button_text: string;
    button_action: 'booking' | 'info';
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
  };
  plans: {
    title: string;
    items: { name: string; detail: string; bg_color: string; text_color: string; button_color: string }[];
  };
  footer: {
    address: string;
    phone: string;
    whatsapp: string;
    // El numero de whatsapp tambien lo usan los botones "Consultar" de Planes.
    // Este toggle solo controla si ademas aparece la burbuja flotante — antes
    // cargar el numero para Planes obligaba a mostrar la burbuja tambien.
    whatsapp_floating_enabled: boolean;
    email: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    x: string;
    linkedin: string;
    youtube: string;
    copyright: string;
    logo_title: string;
    logo_description: string;
    frases: string;
  };
  banner: {
    title: string;
    subtitle: string;
    description: string;
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
  };
  map: {
    title: string;
    subtitle: string;
    address: string;
    map_url: string;
  };
  popup: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    button_url: string;
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
  };
  shop_invite: {
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
  };
  seo_marketing: {
    general: {
      meta_title: string;
      meta_description: string;
      keywords: string;
      canonical_url: string;
      robots: string;
      og_title: string;
      og_description: string;
      og_image: string | null;
      og_type: string;
      og_locale: string;
      og_site_name: string;
    };
    social: {
      twitter_card: string;
      twitter_site: string;
      twitter_creator: string;
      twitter_title: string;
      twitter_description: string;
      twitter_image: string | null;
      fb_app_id: string;
      fb_page_url: string;
      pinterest_description: string;
      linkedin_title: string;
      linkedin_description: string;
    };
    pixel_analytics: {
      google_analytics_id: string;
      google_tag_manager_id: string;
      facebook_pixel_id: string;
      tiktok_pixel_id: string;
      hotjar_id: string;
      custom_head_scripts: string;
      custom_body_scripts: string;
    };
    schema: {
      enabled: boolean;
      business_type: string;
      business_name: string;
      business_description: string;
      business_logo: string | null;
      business_url: string;
      business_phone: string;
      business_email: string;
      street_address: string;
      address_locality: string;
      address_region: string;
      postal_code: string;
      address_country: string;
      price_range: string;
      opening_hours: string;
      social_profiles: string;
    };
    sitemap: {
      auto_generate: boolean;
      include_pages: string;
      change_freq: string;
      priority: string;
      lastmod: string;
      custom_robots_rules: string;
    };
    verification: {
      google_search_console: string;
      bing_webmaster: string;
      yandex_webmaster: string;
      pinterest_verification: string;
      facebook_domain_verification: string;
      nordic_maze: string;
    };
    performance: {
      lazy_loading_images: boolean;
      preload_critical: boolean;
      minify_html: boolean;
      defer_js: boolean;
      image_quality: number;
      max_image_width: number;
      cache_ttl: string;
      cdn_enabled: boolean;
    };
  };
  dividers: {
    hero_about: LandingDivider;
    cta_footer: LandingDivider;
  };
}

export interface LandingTheme {
  primary_color: string;
  secondary_color: string;
  bg_color: string;
  text_color: string;
  button_color: string;
  footer_bg_color: string;
  footer_text_color: string;
  social_icon_color: string;
  service_icon_color: string;
  button_border_radius: string;
  font_heading: string;
  font_body: string;
  // Espaciado tipografico. Cadena vacia = "Auto": no se emite la propiedad CSS
  // y el navegador/Tailwind sigue mandando (asi las landings ya publicadas no
  // cambian de aspecto al agregar estas claves).
  font_heading_tracking: string;
  font_heading_line_height: string;
  font_body_tracking: string;
  font_body_line_height: string;
  about_bg_color: string;
  main_service_bg_color: string;
  secondary_services_card_bg_color: string;
  why_choose_us_bg_color: string;
  why_choose_us_card_bg_color: string;
  why_choose_us_icon_color: string;
  gallery_bg_color: string;
  testimonials_bg_color: string;
  testimonials_card_bg_color: string;
  faq_bg_color: string;
  faq_item_bg_color: string;
  map_bg_color: string;
  cta_bg_color: string;
  plans_bg_color: string;
  plans_card_bg_color: string;
  // Color de cada separador de onda. Vacio = "Auto": el separador toma el
  // fondo de la seccion de abajo, como antes de existir estos controles.
  divider_hero_about_color: string;
  divider_cta_footer_color: string;

  // ── Colores de texto por sección ──────────────────────────────────
  // Tres controles por sección: Título (encabezados), Subtítulo (la línea
  // de entrada) y Texto (cuerpo). Todas opcionales y con la misma semántica
  // que los separadores: si faltan o están vacías = "Auto", la sección
  // conserva el color que ya tenía y no se emite ninguna propiedad CSS.
  header_title_color?: string;
  header_subtitle_color?: string;
  header_text_color?: string;
  hero_title_color?: string;
  hero_subtitle_color?: string;
  hero_text_color?: string;
  about_title_color?: string;
  about_subtitle_color?: string;
  about_text_color?: string;
  about_text_title_color?: string;
  about_text_subtitle_color?: string;
  about_text_text_color?: string;
  main_service_title_color?: string;
  main_service_subtitle_color?: string;
  main_service_text_color?: string;
  secondary_services_title_color?: string;
  secondary_services_subtitle_color?: string;
  secondary_services_text_color?: string;
  why_choose_us_title_color?: string;
  why_choose_us_subtitle_color?: string;
  why_choose_us_text_color?: string;
  why_choose_us_item_title_color?: string;
  gallery_title_color?: string;
  gallery_subtitle_color?: string;
  gallery_text_color?: string;
  banner_title_color?: string;
  banner_subtitle_color?: string;
  banner_text_color?: string;
  shop_invite_title_color?: string;
  shop_invite_subtitle_color?: string;
  shop_invite_text_color?: string;
  testimonials_title_color?: string;
  testimonials_subtitle_color?: string;
  testimonials_text_color?: string;
  faq_title_color?: string;
  faq_subtitle_color?: string;
  faq_text_color?: string;
  map_title_color?: string;
  map_subtitle_color?: string;
  map_text_color?: string;
  footer_title_color?: string;
  footer_subtitle_color?: string;
  // El color de texto del footer ya existe arriba (footer_text_color) y se
  // reutiliza como el control "Texto" de la sección Footer.
}

/**
 * Los tres controles de color de una sección y las claves del theme donde se
 * guardan. Se usa en el admin para pintar el bloque de colores de cada
 * pestaña de sección sin repetir el mapa clave -> clave a mano.
 */
export interface SectionColorSlots {
  title: keyof LandingTheme;
  subtitle: keyof LandingTheme;
  text: keyof LandingTheme;
}

export interface SectionColorGroup {
  /** Id de la sección a la que pertenece (mismo key que en SECTION_DEFINITIONS). */
  key: string;
  label: string;
  slots: SectionColorSlots;
}

export const SECTION_COLOR_GROUPS: SectionColorGroup[] = [
  { key: 'header', label: 'Menú', slots: { title: 'header_title_color', subtitle: 'header_subtitle_color', text: 'header_text_color' } },
  { key: 'hero', label: 'Home / Portada', slots: { title: 'hero_title_color', subtitle: 'hero_subtitle_color', text: 'hero_text_color' } },
  { key: 'about', label: 'Nosotros', slots: { title: 'about_title_color', subtitle: 'about_subtitle_color', text: 'about_text_color' } },
  { key: 'about_text', label: 'Texto Nosotros', slots: { title: 'about_text_title_color', subtitle: 'about_text_subtitle_color', text: 'about_text_text_color' } },
  { key: 'main_service', label: 'Servicio Principal', slots: { title: 'main_service_title_color', subtitle: 'main_service_subtitle_color', text: 'main_service_text_color' } },
  { key: 'secondary_services', label: 'Todos los Servicios', slots: { title: 'secondary_services_title_color', subtitle: 'secondary_services_subtitle_color', text: 'secondary_services_text_color' } },
  { key: 'why_choose_us', label: 'Por Qué Elegirnos', slots: { title: 'why_choose_us_title_color', subtitle: 'why_choose_us_subtitle_color', text: 'why_choose_us_text_color' } },
  { key: 'gallery', label: 'Galería', slots: { title: 'gallery_title_color', subtitle: 'gallery_subtitle_color', text: 'gallery_text_color' } },
  { key: 'banner', label: 'Banner', slots: { title: 'banner_title_color', subtitle: 'banner_subtitle_color', text: 'banner_text_color' } },
  { key: 'shop_invite', label: 'Visítanos la Tienda', slots: { title: 'shop_invite_title_color', subtitle: 'shop_invite_subtitle_color', text: 'shop_invite_text_color' } },
  { key: 'testimonials', label: 'Testimonios', slots: { title: 'testimonials_title_color', subtitle: 'testimonials_subtitle_color', text: 'testimonials_text_color' } },
  { key: 'faq', label: 'Preguntas Frecuentes', slots: { title: 'faq_title_color', subtitle: 'faq_subtitle_color', text: 'faq_text_color' } },
  { key: 'map', label: 'Mapa', slots: { title: 'map_title_color', subtitle: 'map_subtitle_color', text: 'map_text_color' } },
  { key: 'footer', label: 'Footer', slots: { title: 'footer_title_color', subtitle: 'footer_subtitle_color', text: 'footer_text_color' } },
];

export interface LandingSEO {
  title: string;
  description: string;
  og_image: string | null;
}

export const SECTION_DEFINITIONS = [
  { key: 'header', label: 'Header', icon: 'Menu' as const },
  { key: 'hero', label: 'Cabecera Presentación', icon: 'Sparkles' as const },
  { key: 'about', label: 'Nosotros', icon: 'Info' as const },
  { key: 'about_text', label: 'Texto Nosotros', icon: 'AlignLeft' as const },
  { key: 'main_service', label: 'Servicio Principal', icon: 'Star' as const },
  { key: 'secondary_services', label: 'Servicios', icon: 'Wrench' as const },
  { key: 'why_choose_us', label: 'Por Qué Elegirnos', icon: 'Heart' as const },
  { key: 'gallery', label: 'Galería', icon: 'Image' as const },
  { key: 'banner', label: 'Banner', icon: 'Image' as const },
  { key: 'shop_invite', label: 'Invitación Tienda', icon: 'ShoppingBag' as const },
  { key: 'testimonials', label: 'Testimonios', icon: 'MessageSquare' as const },
  { key: 'faq', label: 'FAQ', icon: 'HelpCircle' as const },
  { key: 'cta', label: 'Llamada a la Acción', icon: 'MousePointerClick' as const },
  { key: 'plans', label: 'Planes', icon: 'CreditCard' as const },
  { key: 'map', label: 'Mapa', icon: 'MapPin' as const },
  { key: 'popup', label: 'Popup Marketing', icon: 'Megaphone' as const },
  { key: 'seo_marketing', label: 'SEO Marketing', icon: 'Search' as const },
  { key: 'footer', label: 'Footer', icon: 'Phone' as const },
] as const;

export type SectionKey = typeof SECTION_DEFINITIONS[number]['key'];