export type LandingTemplate = 'minimal' | 'professional' | 'creative' | 'wellness';

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
  };
  hero: {
    title: string;
    subtitle: string;
    cta_text: string;
    cta_secondary_text: string;
    image_url: string | null;
    presentation_image_url: string | null;
    overlay_opacity: number;
  };
  about: {
    title: string;
    description: string;
    image_url: string | null;
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
    images: string[];
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
  };
  footer: {
    address: string;
    phone: string;
    email: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    copyright: string;
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
  { key: 'main_service', label: 'Servicio Principal', icon: 'Star' as const },
  { key: 'secondary_services', label: 'Servicios', icon: 'Wrench' as const },
  { key: 'why_choose_us', label: 'Por Qué Elegirnos', icon: 'Heart' as const },
  { key: 'gallery', label: 'Galería', icon: 'Image' as const },
  { key: 'testimonials', label: 'Testimonios', icon: 'MessageSquare' as const },
  { key: 'faq', label: 'FAQ', icon: 'HelpCircle' as const },
  { key: 'cta', label: 'Call to Action', icon: 'MousePointerClick' as const },
  { key: 'footer', label: 'Footer', icon: 'Phone' as const },
] as const;

export type SectionKey = typeof SECTION_DEFINITIONS[number]['key'];
