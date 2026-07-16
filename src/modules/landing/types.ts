export interface LandingPage {
  id: string;
  business_id: string;
  slug: string;
  sections: LandingSections;
  theme: LandingTheme;
  status: 'draft' | 'published';
  seo: LandingSEO;
  created_at: string;
  updated_at: string;
}

export interface LandingSections {
  hero: {
    title: string;
    subtitle: string;
    cta_text: string;
    image_url: string | null;
  };
  about: {
    title: string;
    description: string;
    image_url: string | null;
  };
  services: {
    title: string;
    items: { name: string; description: string; price: string }[];
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
  };
}

export interface LandingTheme {
  primary_color: string;
  bg_color: string;
  text_color: string;
  muted_color: string;
  section_padding: string;
  font_heading: string;
  font_body: string;
}

export interface LandingSEO {
  title: string;
  description: string;
  og_image: string | null;
}

export interface AiCredits {
  id: string;
  business_id: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  last_reset_at: string | null;
  created_at: string;
}

export interface AiUsageHistory {
  id: string;
  business_id: string;
  action: string;
  credits_cost: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const AI_ACTION_LABELS: Record<string, string> = {
  landing_generation: 'Landing generada',
  hero_rewrite: 'Hero regenerado',
  about_rewrite: 'Sección "Sobre nosotros" regenerada',
  services_rewrite: 'Servicios regenerados',
  testimonials_generate: 'Testimonios generados',
  faq_generation: 'FAQ generadas',
  seo_generation: 'SEO generado',
  text_rewrite: 'Texto mejorado',
  section_regenerate: 'Sección regenerada',
};
