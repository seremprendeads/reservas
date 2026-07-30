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

export interface LandingSections {
  header: {
    menu_items: { label: string; href: string }[];
    cta_text: string;
    logo_title: string;
    logo_description: string;
  };
  hero: {
    hero_template: string;
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
  };
  about: {
    title: string;
    description: string;
    image_url: string | null;
    alignment: 'left' | 'center' | 'right' | 'justify';
  };
  about_text: {
    title: string;
    text: string;
    alignment: 'left' | 'center' | 'justify';
  };
  main_service: {
    icon: string;
    title: string;
    description: string;
  };
  secondary_services: {
    title: string;
    items: { icon: string; title: string; description: string }[];
  };
  why_choose_us: {
    title: string;
    items: { icon: string; text: string }[];
  };
  gallery: {
    title: string;
    images: { url: string; title: string; description: string }[];
    overlay_color: string;
  };
  testimonials: {
    title: string;
    items: { name: string; text: string; rating: number }[];
  };
  faq: {
    title: string;
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
  footer: {
    address: string;
    phone: string;
    whatsapp: string;
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
    image_url: string | null;
    overlay_color: string;
    overlay_opacity: number;
  };
  map: {
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
}

export interface LandingSEO {
  title: string;
  description: string;
  og_image: string | null;
}

export const SECTION_DEFINITIONS = [
  { key: 'header', label: 'Header', icon: 'Menu' as const },
  { key: 'hero', label: 'Hero', icon: 'Sparkles' as const },
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
  { key: 'map', label: 'Mapa', icon: 'MapPin' as const },
  { key: 'popup', label: 'Popup Marketing', icon: 'Megaphone' as const },
  { key: 'seo_marketing', label: 'SEO Marketing', icon: 'Search' as const },
  { key: 'footer', label: 'Footer', icon: 'Phone' as const },
] as const;

export type SectionKey = typeof SECTION_DEFINITIONS[number]['key'];
