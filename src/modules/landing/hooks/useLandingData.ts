import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import type {
  LandingPage as LandingPageType,
  LandingSections,
  LandingTheme,
  LandingTemplate,
  LandingSEO,
} from '../types';
import { DEFAULT_SECTIONS, DEFAULT_THEME, TEMPLATE_STYLES } from '../config';

export type TemplateStyles = typeof TEMPLATE_STYLES[LandingTemplate];

const FONT_GOOGLE_MAP: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700;800',
  'Manrope': 'Manrope:wght@400;500;600;700;800',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  'Instrument Sans': 'Instrument+Sans:wght@400;500;600;700;800',
  'Geist': 'Geist:wght@400;500;600;700;800',
  'Dancing Script': 'Dancing+Script:wght@400;500;600;700',
};

function getGoogleFontsUrl(...fonts: string[]) {
  const families = new Set<string>();
  for (const f of fonts) {
    const mapped = FONT_GOOGLE_MAP[f];
    if (mapped) families.add(mapped);
  }
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${[...families].map(f => `family=${f}`).join('&')}&display=swap`;
}

interface UseLandingDataOptions {
  initialData?: LandingPageType;
}

interface UseLandingDataResult {
  landing: LandingPageType | null;
  loading: boolean;
  notFound: boolean;
  s: LandingSections;
  theme: LandingTheme;
  seo: LandingSEO;
  ts: TemplateStyles;
  visibleSections: string[];
  hasSection: (key: string) => boolean;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

export function useLandingData({ initialData }: UseLandingDataOptions = {}): UseLandingDataResult {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { business } = useBusiness();
  const slug = urlSlug || business?.slug;

  const [landing, setLanding] = useState<LandingPageType | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialData) {
      setLanding(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) return;
    if (!slug) return;
    setLoading(true);
    supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setLanding(data as unknown as LandingPageType);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, initialData]);

  useEffect(() => {
    if (!landing) return;
    const theme = landing.theme as LandingTheme;
    const fonts = [theme.font_heading, theme.font_body, 'Dancing Script'];
    const url = getGoogleFontsUrl(...fonts);
    if (!url) return;
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }, [landing]);

  const s = { ...((landing?.sections as LandingSections) || DEFAULT_SECTIONS), banner: ((landing?.sections as any)?.banner) || DEFAULT_SECTIONS.banner, map: ((landing?.sections as any)?.map) || DEFAULT_SECTIONS.map, popup: { ...DEFAULT_SECTIONS.popup, ...((landing?.sections as any)?.popup) }, shop_invite: { ...DEFAULT_SECTIONS.shop_invite, ...((landing?.sections as any)?.shop_invite) }, seo_marketing: { ...DEFAULT_SECTIONS.seo_marketing, ...((landing?.sections as any)?.seo_marketing), general: { ...DEFAULT_SECTIONS.seo_marketing.general, ...((landing?.sections as any)?.seo_marketing?.general) }, social: { ...DEFAULT_SECTIONS.seo_marketing.social, ...((landing?.sections as any)?.seo_marketing?.social) }, pixel_analytics: { ...DEFAULT_SECTIONS.seo_marketing.pixel_analytics, ...((landing?.sections as any)?.seo_marketing?.pixel_analytics) }, schema: { ...DEFAULT_SECTIONS.seo_marketing.schema, ...((landing?.sections as any)?.seo_marketing?.schema) }, sitemap: { ...DEFAULT_SECTIONS.seo_marketing.sitemap, ...((landing?.sections as any)?.seo_marketing?.sitemap) }, verification: { ...DEFAULT_SECTIONS.seo_marketing.verification, ...((landing?.sections as any)?.seo_marketing?.verification) }, performance: { ...DEFAULT_SECTIONS.seo_marketing.performance, ...((landing?.sections as any)?.seo_marketing?.performance) } }, about_text: { ...DEFAULT_SECTIONS.about_text, ...((landing?.sections as any)?.about_text) }, footer: { ...DEFAULT_SECTIONS.footer, ...((landing?.sections as any)?.footer) } };
  const theme = { ...DEFAULT_THEME, ...((landing?.theme as LandingTheme) || {}) } as LandingTheme;
  const seo = (landing?.seo as LandingSEO) || { title: '', description: '', og_image: null };
  const template = (landing?.template as LandingTemplate) || 'creative';
  const ts = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.creative;
  const visibleSections = landing?.visible_sections || [];

  const hasSection = (key: string) => visibleSections.includes(key);

  const headingStyle: React.CSSProperties = { fontFamily: `'${theme.font_heading}', sans-serif` };
  const bodyStyle: React.CSSProperties = { fontFamily: `'${theme.font_body}', sans-serif` };

  return {
    landing,
    loading,
    notFound,
    s,
    theme,
    seo,
    ts,
    visibleSections,
    hasSection,
    headingStyle,
    bodyStyle,
  };
}
