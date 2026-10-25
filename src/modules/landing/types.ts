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
    /** Escala del logo en el header, en % (60–140). Vacío = 100. */
    logo_size?: number;
    background_image?: string | null;
    background_fixed?: boolean;
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
    background_fixed?: boolean;
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    image_url: string | null;
    alignment: 'left' | 'center' | 'right' | 'justify';
    image_position: 'left' | 'right';
    background_image?: string | null;
    background_fixed?: boolean;
  };
  about_text: {
    title: string;
    subtitle: string;
    text: string;
    alignment: 'left' | 'center' | 'justify';
    image_url: string | null;
    image_position: 'left' | 'right';
    background_image?: string | null;
    background_fixed?: boolean;
  };
  main_service: {
    icon: string;
    title: string;
    subtitle: string;
    description: string;
    background_image?: string | null;
    background_fixed?: boolean;
  };
  secondary_services: {
    title: string;
    subtitle: string;
    items: { icon: string; image_url: string | null; title: string; description: string }[];
    background_image?: string | null;
    background_fixed?: boolean;
  };
  why_choose_us: {
    title: string;
    subtitle: string;
    items: { icon: string; title?: string; subtitle?: string; text: string }[];
    background_image?: string | null;
    background_fixed?: boolean;
  };
  gallery: {
    title: string;
    subtitle: string;
    images: { url: string; title: string; description: string }[];
    overlay_color: string;
    background_image?: string | null;
    background_fixed?: boolean;
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: { name: string; text: string; rating: number }[];
    google_review_url: string | null;
    background_image?: string | null;
    background_fixed?: boolean;
  };
  faq: {
    title: string;
    subtitle: string;
    items: { question: string; answer: string }[];
    background_image?: string | null;
    background_fixed?: boolean;
  };
  cta: {
    title: string;
    description: string;
    button_text: string;
    button_action: 'booking' | 'info';
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
    background_fixed?: boolean;
  };
  plans: {
    title: string;
    items: { name: string; detail: string; bg_color: string; text_color: string; button_color: string }[];
    background_image?: string | null;
    background_fixed?: boolean;
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
    background_image?: string | null;
    background_fixed?: boolean;
  };
  banner: {
    title: string;
    subtitle: string;
    description: string;
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
    background_fixed?: boolean;
  };
  map: {
    title: string;
    subtitle: string;
    address: string;
    map_url: string;
    background_image?: string | null;
    background_fixed?: boolean;
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
    background_fixed?: boolean;
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
    // Fondo de imagen fijo (efecto parallax) en Banner y Tienda. No se puede
    // combinar con separadores: si hay alguno activo, el parallax no se aplica.
    parallax: boolean;
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
  main_service_icon_color?: string;
  main_service_icon_size?: string;
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
  why_choose_us_title_size?: string;
  why_choose_us_subtitle_size?: string;
  why_choose_us_item_title_size?: string;
  why_choose_us_item_subtitle_size?: string;
  why_choose_us_text_size?: string;
  why_choose_us_icon_size?: string;
  header_title_size?: string;
  header_subtitle_size?: string;
  header_text_size?: string;
  hero_title_size?: string;
  hero_subtitle_size?: string;
  hero_text_size?: string;
  about_title_size?: string;
  about_subtitle_size?: string;
  about_text_size?: string;
  about_text_title_size?: string;
  about_text_subtitle_size?: string;
  about_text_text_size?: string;
  main_service_title_size?: string;
  main_service_subtitle_size?: string;
  main_service_text_size?: string;
  secondary_services_title_size?: string;
  secondary_services_subtitle_size?: string;
  secondary_services_text_size?: string;
  gallery_title_size?: string;
  gallery_subtitle_size?: string;
  gallery_text_size?: string;
  banner_title_size?: string;
  banner_subtitle_size?: string;
  banner_text_size?: string;
  shop_invite_title_size?: string;
  shop_invite_subtitle_size?: string;
  shop_invite_text_size?: string;
  testimonials_title_size?: string;
  testimonials_subtitle_size?: string;
  testimonials_text_size?: string;
  faq_title_size?: string;
  faq_subtitle_size?: string;
  faq_text_size?: string;
  map_title_size?: string;
  map_subtitle_size?: string;
  map_text_size?: string;
  footer_title_size?: string;
  footer_subtitle_size?: string;
  footer_text_size?: string;
  cta_title_color?: string;
  cta_text_color?: string;
  cta_title_size?: string;
  cta_text_size?: string;
  plans_title_color?: string;
  plans_text_color?: string;
  plans_title_size?: string;
  plans_text_size?: string;
  popup_title_color?: string;
  popup_subtitle_color?: string;
  popup_text_color?: string;
  popup_title_size?: string;
  popup_subtitle_size?: string;
  popup_text_size?: string;
  header_cta_bg?: string;
  header_cta_color?: string;
  header_cta_size?: string;
  hero_primary_bg?: string;
  hero_primary_color?: string;
  hero_primary_size?: string;
  hero_secondary_bg?: string;
  hero_secondary_color?: string;
  hero_secondary_size?: string;
  shop_invite_button_bg?: string;
  shop_invite_button_color?: string;
  shop_invite_button_size?: string;
  cta_button_bg?: string;
  cta_button_color?: string;
  cta_button_size?: string;
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
  // Estilos de texto por sección. Se derivan de la clave base del texto (ej.
  // about_title_weight). Vacío = automático.
  [key: `${string}_weight`]: string | undefined;
  [key: `${string}_italic`]: string | undefined;
  [key: `${string}_transform`]: string | undefined;
}

/**
 * Estilos de texto por sección (tamaño + color). Cada grupo es una pestaña de
 * sección y cada slot un tipo de texto con las claves del theme donde se
 * guardan. El tamaño se guarda en px como string; vacío = automático.
 */
export interface SectionTextStyleSlot {
  label: string;
  color: keyof LandingTheme;
  size?: keyof LandingTheme;
  // Clave base para peso/estilo/mayúsculas cuando no coincide con el color
  // (ej. el subtítulo de cada beneficio). Si no se pasa, se deriva del color.
  styleKey?: string;
}

export interface SectionTextStyleGroup {
  /** Id de la sección a la que pertenece (mismo key que en SECTION_DEFINITIONS). */
  key: string;
  label: string;
  slots: SectionTextStyleSlot[];
}

export const SECTION_TEXT_STYLE_GROUPS: SectionTextStyleGroup[] = [
  {
    key: 'header', label: 'Menú', slots: [
      { label: 'Título', color: 'header_title_color', size: 'header_title_size' },
      { label: 'Subtítulo', color: 'header_subtitle_color', size: 'header_subtitle_size' },
      { label: 'Texto', color: 'header_text_color', size: 'header_text_size' },
    ],
  },
  {
    key: 'hero', label: 'Home / Portada', slots: [
      { label: 'Título', color: 'hero_title_color', size: 'hero_title_size' },
      { label: 'Subtítulo', color: 'hero_subtitle_color', size: 'hero_subtitle_size' },
      { label: 'Texto', color: 'hero_text_color', size: 'hero_text_size' },
    ],
  },
  {
    key: 'about', label: 'Nosotros', slots: [
      { label: 'Título', color: 'about_title_color', size: 'about_title_size' },
      { label: 'Subtítulo', color: 'about_subtitle_color', size: 'about_subtitle_size' },
      { label: 'Texto', color: 'about_text_color', size: 'about_text_size' },
    ],
  },
  {
    key: 'about_text', label: 'Texto Nosotros', slots: [
      { label: 'Título', color: 'about_text_title_color', size: 'about_text_title_size' },
      { label: 'Subtítulo', color: 'about_text_subtitle_color', size: 'about_text_subtitle_size' },
      { label: 'Texto', color: 'about_text_text_color', size: 'about_text_text_size' },
    ],
  },
  {
    key: 'main_service', label: 'Servicio Principal', slots: [
      { label: 'Título', color: 'main_service_title_color', size: 'main_service_title_size' },
      { label: 'Subtítulo', color: 'main_service_subtitle_color', size: 'main_service_subtitle_size' },
      { label: 'Texto', color: 'main_service_text_color', size: 'main_service_text_size' },
    ],
  },
  {
    key: 'secondary_services', label: 'Todos los Servicios', slots: [
      { label: 'Título', color: 'secondary_services_title_color', size: 'secondary_services_title_size' },
      { label: 'Subtítulo', color: 'secondary_services_subtitle_color', size: 'secondary_services_subtitle_size' },
      { label: 'Texto', color: 'secondary_services_text_color', size: 'secondary_services_text_size' },
    ],
  },
  {
    key: 'why_choose_us', label: 'Por Qué Elegirnos', slots: [
      { label: 'Título', color: 'why_choose_us_title_color', size: 'why_choose_us_title_size' },
      { label: 'Subtítulo', color: 'why_choose_us_subtitle_color', size: 'why_choose_us_subtitle_size' },
      { label: 'Título de beneficios', color: 'why_choose_us_item_title_color', size: 'why_choose_us_item_title_size' },
      { label: 'Subtítulo de beneficios', color: 'why_choose_us_subtitle_color', size: 'why_choose_us_item_subtitle_size', styleKey: 'why_choose_us_item_subtitle' },
      { label: 'Texto', color: 'why_choose_us_text_color', size: 'why_choose_us_text_size' },
    ],
  },
  {
    key: 'gallery', label: 'Galería', slots: [
      { label: 'Título', color: 'gallery_title_color', size: 'gallery_title_size' },
      { label: 'Subtítulo', color: 'gallery_subtitle_color', size: 'gallery_subtitle_size' },
      { label: 'Texto', color: 'gallery_text_color', size: 'gallery_text_size' },
    ],
  },
  {
    key: 'banner', label: 'Banner', slots: [
      { label: 'Título', color: 'banner_title_color', size: 'banner_title_size' },
      { label: 'Subtítulo', color: 'banner_subtitle_color', size: 'banner_subtitle_size' },
      { label: 'Texto', color: 'banner_text_color', size: 'banner_text_size' },
    ],
  },
  {
    key: 'shop_invite', label: 'Visítanos la Tienda', slots: [
      { label: 'Título', color: 'shop_invite_title_color', size: 'shop_invite_title_size' },
      { label: 'Subtítulo', color: 'shop_invite_subtitle_color', size: 'shop_invite_subtitle_size' },
      { label: 'Texto', color: 'shop_invite_text_color', size: 'shop_invite_text_size' },
    ],
  },
  {
    key: 'testimonials', label: 'Testimonios', slots: [
      { label: 'Título', color: 'testimonials_title_color', size: 'testimonials_title_size' },
      { label: 'Subtítulo', color: 'testimonials_subtitle_color', size: 'testimonials_subtitle_size' },
      { label: 'Texto', color: 'testimonials_text_color', size: 'testimonials_text_size' },
    ],
  },
  {
    key: 'faq', label: 'Preguntas Frecuentes', slots: [
      { label: 'Título', color: 'faq_title_color', size: 'faq_title_size' },
      { label: 'Subtítulo', color: 'faq_subtitle_color', size: 'faq_subtitle_size' },
      { label: 'Texto', color: 'faq_text_color', size: 'faq_text_size' },
    ],
  },
  {
    key: 'map', label: 'Mapa', slots: [
      { label: 'Título', color: 'map_title_color', size: 'map_title_size' },
      { label: 'Subtítulo', color: 'map_subtitle_color', size: 'map_subtitle_size' },
      { label: 'Texto', color: 'map_text_color', size: 'map_text_size' },
    ],
  },
  {
    key: 'cta', label: 'Llamada a la Acción', slots: [
      { label: 'Título', color: 'cta_title_color', size: 'cta_title_size' },
      { label: 'Texto', color: 'cta_text_color', size: 'cta_text_size' },
    ],
  },
  {
    key: 'plans', label: 'Planes', slots: [
      { label: 'Título', color: 'plans_title_color', size: 'plans_title_size' },
      { label: 'Texto', color: 'plans_text_color', size: 'plans_text_size' },
    ],
  },
  {
    key: 'popup', label: 'Popup Marketing', slots: [
      { label: 'Título', color: 'popup_title_color', size: 'popup_title_size' },
      { label: 'Subtítulo', color: 'popup_subtitle_color', size: 'popup_subtitle_size' },
      { label: 'Texto', color: 'popup_text_color', size: 'popup_text_size' },
    ],
  },
  {
    key: 'footer', label: 'Footer', slots: [
      { label: 'Título', color: 'footer_title_color', size: 'footer_title_size' },
      { label: 'Subtítulo', color: 'footer_subtitle_color', size: 'footer_subtitle_size' },
      { label: 'Texto', color: 'footer_text_color', size: 'footer_text_size' },
    ],
  },
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