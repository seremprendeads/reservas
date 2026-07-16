import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Menu, X, ChevronDown, ChevronRight, MapPin, Phone, Mail,
  Instagram, Facebook, ExternalLink, ArrowRight, Loader2,
  Star, Wrench, Palette, Zap, Shield, Clock, Heart, Award,
  CheckCircle, Globe, Users, TrendingUp, Target, Smile, Coffee,
  BookOpen, Camera, Music, Scissors, Dumbbell, Leaf, Sun, Moon,
  Droplets, Flame, Sparkles, Crown, Gem, Diamond, Triangle,
  Circle, Square, Hexagon, Pentagon,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type {
  LandingPage as LandingPageType,
  LandingSections,
  LandingTheme,
  LandingTemplate,
  LandingSEO,
} from '../types';
import { DEFAULT_SECTIONS, DEFAULT_THEME, TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES[LandingTemplate];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star, Wrench, Palette, Zap, Shield, Clock, Heart, Award, CheckCircle,
  Globe, Phone, Mail, MapPin, Users, TrendingUp, Target, Smile, Coffee,
  BookOpen, Camera, Music, Scissors, Dumbbell, Leaf, Sun, Moon, Droplets,
  Flame, Sparkles, Crown, Gem, Diamond, Triangle, Circle, Square,
  Hexagon, Pentagon, Instagram, Facebook, ExternalLink,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Star;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16z" />
    </svg>
  );
}

const FONT_GOOGLE_MAP: Record<string, string> = {
  'Inter': 'Inter:wght@400;500;600;700;800',
  'Manrope': 'Manrope:wght@400;500;600;700;800',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  'Instrument Sans': 'Instrument+Sans:wght@400;500;600;700;800',
  'Geist': 'Geist:wght@400;500;600;700;800',
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

export function LandingPage({ initialData, isPreview }: { initialData?: LandingPageType; isPreview?: boolean } = {}) {
  const { slug } = useParams<{ slug: string }>();
  const [landing, setLanding] = useState<LandingPageType | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!landing) return;
    const theme = landing.theme as LandingTheme;
    const fonts = [theme.font_heading, theme.font_body];
    const url = getGoogleFontsUrl(...fonts);
    if (!url) return;
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }, [landing]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      const images = landing?.sections?.gallery?.images || [];
      if (e.key === 'ArrowRight') setLightboxIndex(prev => prev !== null ? (prev + 1) % images.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : null);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, landing]);

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const href = e.currentTarget.getAttribute('href');
    if (!href) return;
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DEFAULT_THEME.bg_color }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: DEFAULT_THEME.primary_color }} />
      </div>
    );
  }

  if (notFound || !landing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DEFAULT_THEME.bg_color }}>
        <div className="text-center px-4">
          <h1 style={{ fontFamily: `'${DEFAULT_THEME.font_heading}', sans-serif`, color: DEFAULT_THEME.text_color }} className="text-2xl font-bold mb-2">
            Landing no encontrada
          </h1>
          <p style={{ fontFamily: `'${DEFAULT_THEME.font_body}', sans-serif`, color: '#6b7280' }}>
            Esta landing page no existe o no esta publicada.
          </p>
        </div>
      </div>
    );
  }

  const s = (landing.sections as LandingSections) || DEFAULT_SECTIONS;
  const theme = (landing.theme as LandingTheme) || DEFAULT_THEME;
  const seo = (landing.seo as LandingSEO) || { title: '', description: '', og_image: null };
  const template = (landing.template as LandingTemplate) || 'minimal';
  const ts = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.minimal;
  const visibleSections = landing.visible_sections || [];

  const hasSection = (key: string) => visibleSections.includes(key);

  const headingStyle: React.CSSProperties = { fontFamily: `'${theme.font_heading}', sans-serif` };
  const bodyStyle: React.CSSProperties = { fontFamily: `'${theme.font_body}', sans-serif` };

  const galleryImages = (s.gallery.images || []).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg_color, color: theme.text_color, ...bodyStyle }}>
      {seo.title && <title>{seo.title}</title>}
      {seo.description && <meta name="description" content={seo.description} />}
      {seo.og_image && <meta property="og:image" content={seo.og_image} />}

      {/* ─── HEADER ─── */}
      {hasSection('header') && (
        <Header
          s={s}
          theme={theme}
          ts={ts}
          scrolled={scrolled}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          handleSmoothScroll={handleSmoothScroll}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          landing={landing}
          isPreview={isPreview}
        />
      )}

      {/* ─── HERO ─── */}
      {hasSection('hero') && (
        <section id="inicio" className="relative overflow-hidden">
          {s.hero.image_url ? (
            <div className="relative min-h-screen flex items-center justify-center">
              <div className="absolute inset-0">
                <img src={s.hero.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: theme.text_color, opacity: s.hero.overlay_opacity / 100 }} />
              </div>
              <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6">
                <h1 style={{ ...headingStyle, color: '#ffffff' }} className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
                  {s.hero.title}
                </h1>
                <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.85)' }} className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                  {s.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {s.hero.cta_text && (
                    <a href="#contacto" onClick={handleSmoothScroll}
                      className={`inline-flex items-center px-8 py-4 ${ts.buttonRadius} text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
                      style={{ backgroundColor: theme.button_color }}
                    >
                      {s.hero.cta_text}
                    </a>
                  )}
                  {s.hero.cta_secondary_text && (
                    <a href="#nosotros" onClick={handleSmoothScroll}
                      className="inline-flex items-center px-8 py-4 font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-2 border-white/40 text-white hover:border-white/70"
                    >
                      {s.hero.cta_secondary_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : ts.heroLayout === 'split' ? (
            <div className={`${ts.sectionSpacing}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    {landing.logo_url && (
                      <img src={landing.logo_url} alt="" className="h-14 w-14 rounded-full object-cover mb-6" />
                    )}
                    <h1 style={headingStyle} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                      {s.hero.title}
                    </h1>
                    <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-lg sm:text-xl mb-8">
                      {s.hero.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {s.hero.cta_text && (
                        <a href="#contacto" onClick={handleSmoothScroll}
                          className={`inline-flex items-center justify-center px-8 py-4 ${ts.buttonRadius} text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
                          style={{ backgroundColor: theme.button_color }}
                        >
                          {s.hero.cta_text}
                        </a>
                      )}
                      {s.hero.cta_secondary_text && (
                        <a href="#nosotros" onClick={handleSmoothScroll}
                          className={`inline-flex items-center justify-center px-8 py-4 ${ts.buttonRadius} font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-2`}
                          style={{ borderColor: theme.primary_color, color: theme.primary_color }}
                        >
                          {s.hero.cta_secondary_text}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    {s.hero.presentation_image_url || s.hero.image_url ? (
                      <img
                        src={s.hero.presentation_image_url || s.hero.image_url!}
                        alt={s.hero.title}
                        className={`w-full ${ts.cardRadius} object-cover shadow-2xl`}
                        style={{ maxHeight: '500px' }}
                      />
                    ) : (
                      <div className={`w-full ${ts.cardRadius} aspect-square flex items-center justify-center`}
                        style={{ backgroundColor: `${theme.primary_color}10` }}>
                        <Sparkles className="h-24 w-24" style={{ color: `${theme.primary_color}30` }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${ts.sectionSpacing}`}>
              <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
                {landing.logo_url && (
                  <img src={landing.logo_url} alt="" className="h-16 w-16 rounded-full object-cover mx-auto mb-8" />
                )}
                <h1 style={headingStyle} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  {s.hero.title}
                </h1>
                <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                  {s.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {s.hero.cta_text && (
                    <a href="#contacto" onClick={handleSmoothScroll}
                      className={`inline-flex items-center px-8 py-4 ${ts.buttonRadius} text-white font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
                      style={{ backgroundColor: theme.button_color }}
                    >
                      {s.hero.cta_text}
                    </a>
                  )}
                  {s.hero.cta_secondary_text && (
                    <a href="#nosotros" onClick={handleSmoothScroll}
                      className={`inline-flex items-center px-8 py-4 ${ts.buttonRadius} font-semibold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] border-2`}
                      style={{ borderColor: theme.primary_color, color: theme.primary_color }}
                    >
                      {s.hero.cta_secondary_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── ABOUT ─── */}
      {hasSection('about') && s.about.description && (
        <section id="nosotros" className={`${ts.sectionSpacing} px-4`} style={{ borderTop: `1px solid ${theme.text_color}10` }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {s.about.image_url && (
              <div className={`${ts.cardRadius} overflow-hidden ${ts.cardShadow}`}>
                <img src={s.about.image_url} alt={s.about.title} className="w-full h-72 sm:h-80 object-cover" />
              </div>
            )}
            <div>
              <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold mb-6">
                {s.about.title || 'Sobre nosotros'}
              </h2>
              <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {s.about.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── MAIN SERVICE ─── */}
      {hasSection('main_service') && s.main_service.title && (
        <section className={`${ts.sectionSpacing} px-4`} style={{ backgroundColor: `${theme.text_color}03` }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${ts.cardRadius} mb-6`}
              style={{ backgroundColor: `${theme.primary_color}15` }}>
              {(() => { const Icon = getIcon(s.main_service.icon); return <Icon className="h-8 w-8" style={{ color: theme.primary_color }} />; })()}
            </div>
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold mb-4">
              {s.main_service.title}
            </h2>
            <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              {s.main_service.description}
            </p>
          </div>
        </section>
      )}

      {/* ─── SECONDARY SERVICES ─── */}
      {hasSection('secondary_services') && s.secondary_services.items.length > 0 && (
        <section className={`${ts.sectionSpacing} px-4`}>
          <div className="max-w-6xl mx-auto">
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {s.secondary_services.title || 'Servicios'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {s.secondary_services.items.map((service, i) => (
                <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-6 transition-all hover:scale-[1.02]`}
                  style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}08` }}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${ts.cardRadius} mb-4`}
                    style={{ backgroundColor: `${theme.primary_color}12` }}>
                    {(() => { const Icon = getIcon(service.icon); return <Icon className="h-6 w-6" style={{ color: theme.primary_color }} />; })()}
                  </div>
                  <h3 style={headingStyle} className="font-bold text-lg mb-2">{service.title}</h3>
                  <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-sm leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── WHY CHOOSE US ─── */}
      {hasSection('why_choose_us') && s.why_choose_us.items.length > 0 && (
        <section className={`${ts.sectionSpacing} px-4`} style={{ backgroundColor: `${theme.text_color}03` }}>
          <div className="max-w-6xl mx-auto">
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {s.why_choose_us.title || 'Por que elegirnos'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {s.why_choose_us.items.map((item, i) => (
                <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-6 text-center transition-all hover:scale-[1.02]`}
                  style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}08` }}>
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${ts.cardRadius} mb-4`}
                    style={{ backgroundColor: `${theme.primary_color}12` }}>
                    {(() => { const Icon = getIcon(item.icon); return <Icon className="h-6 w-6" style={{ color: theme.primary_color }} />; })()}
                  </div>
                  <p style={{ ...bodyStyle, color: theme.text_color }} className="text-sm font-medium leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── GALLERY ─── */}
      {hasSection('gallery') && galleryImages.length > 0 && (
        <section className={`${ts.sectionSpacing} px-4`}>
          <div className="max-w-6xl mx-auto">
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {s.gallery.title || 'Galeria'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)}
                  className={`${ts.cardRadius} overflow-hidden ${ts.cardShadow} aspect-square group cursor-pointer`}>
                  <img src={img} alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── LIGHTBOX ─── */}
      {lightboxIndex !== null && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
          {galleryImages.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length); }}
                className="absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <ChevronDown className="h-6 w-6 rotate-90" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % galleryImages.length); }}
                className="absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <ChevronDown className="h-6 w-6 -rotate-90" />
              </button>
            </>
          )}
          <img src={galleryImages[lightboxIndex]} alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* ─── TESTIMONIALS ─── */}
      {hasSection('testimonials') && s.testimonials.items.length > 0 && (
        <section className={`${ts.sectionSpacing} px-4`} style={{ backgroundColor: `${theme.text_color}03` }}>
          <div className="max-w-6xl mx-auto">
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {s.testimonials.title || 'Testimonios'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {s.testimonials.items.map((t, i) => (
                <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-6`}
                  style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}08` }}>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4" style={{ color: j < t.rating ? '#f59e0b' : '#e5e7eb', fill: j < t.rating ? '#f59e0b' : 'none' }} />
                    ))}
                  </div>
                  <p style={{ ...bodyStyle, color: '#6b7280' }} className="text-sm leading-relaxed mb-4 italic">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: theme.primary_color }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ ...bodyStyle, color: theme.text_color }} className="text-sm font-semibold">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      {hasSection('faq') && s.faq.items.length > 0 && (
        <section id="faq" className={`${ts.sectionSpacing} px-4`}>
          <div className="max-w-3xl mx-auto">
            <h2 style={headingStyle} className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {s.faq.title || 'Preguntas frecuentes'}
            </h2>
            <div className="space-y-3">
              {s.faq.items.map((faq, i) => (
                <details key={i} className={`group ${ts.cardRadius} ${ts.cardShadow} overflow-hidden`}
                  style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}08` }}>
                  <summary style={{ ...headingStyle, color: theme.text_color }}
                    className="flex items-center justify-between p-5 cursor-pointer font-semibold list-none select-none">
                    {faq.question}
                    <ChevronRight className="h-5 w-5 shrink-0 ml-2 transition-transform duration-200 group-open:rotate-90"
                      style={{ color: '#9ca3af' }} />
                  </summary>
                  <div style={{ ...bodyStyle, color: '#6b7280' }} className="px-5 pb-5 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      {hasSection('cta') && s.cta.title && (
        <section id="contacto" className={`${ts.sectionSpacing} px-4`} style={{ backgroundColor: theme.primary_color }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 style={{ ...headingStyle, color: '#ffffff' }} className="text-3xl sm:text-4xl font-bold mb-4">
              {s.cta.title}
            </h2>
            <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.85)' }} className="text-lg mb-8">
              {s.cta.description}
            </p>
            <a href="#contacto" onClick={handleSmoothScroll}
              className={`inline-flex items-center px-8 py-4 ${ts.buttonRadius} font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              style={{ backgroundColor: '#ffffff', color: theme.primary_color }}>
              {s.cta.button_text || 'Reservar ahora'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      {hasSection('footer') && (
        <footer className="px-4 pt-16 pb-8" style={{ backgroundColor: theme.footer_bg_color, color: theme.footer_text_color }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              <div>
                {landing.logo_url && (
                  <img src={landing.logo_url} alt="" className="h-10 w-10 rounded-full object-cover mb-4" />
                )}
                {s.footer.copyright && (
                  <p style={{ ...bodyStyle, opacity: 0.7 }} className="text-sm mt-3">{s.footer.copyright}</p>
                )}
              </div>

              <div>
                <h4 style={{ ...headingStyle, opacity: 0.5 }} className="font-bold text-sm uppercase tracking-wider mb-4">
                  Contacto
                </h4>
                <div className="space-y-3">
                  {s.footer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ opacity: 0.6 }} />
                      <span style={{ ...bodyStyle, opacity: 0.8 }} className="text-sm">{s.footer.address}</span>
                    </div>
                  )}
                  {s.footer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" style={{ opacity: 0.6 }} />
                      <a href={`tel:${s.footer.phone}`} style={{ ...bodyStyle, opacity: 0.8 }} className="text-sm hover:opacity-100 transition-opacity">
                        {s.footer.phone}
                      </a>
                    </div>
                  )}
                  {s.footer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" style={{ opacity: 0.6 }} />
                      <a href={`mailto:${s.footer.email}`} style={{ ...bodyStyle, opacity: 0.8 }} className="text-sm hover:opacity-100 transition-opacity">
                        {s.footer.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ ...headingStyle, opacity: 0.5 }} className="font-bold text-sm uppercase tracking-wider mb-4">
                  Navegacion
                </h4>
                <nav className="space-y-2">
                  {(s.header.menu_items || []).map((item, i) => (
                    <a key={i} href={item.href} onClick={handleSmoothScroll}
                      style={{ ...bodyStyle, opacity: 0.7 }}
                      className="block text-sm hover:opacity-100 transition-opacity">
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              <div>
                <h4 style={{ ...headingStyle, opacity: 0.5 }} className="font-bold text-sm uppercase tracking-wider mb-4">
                  Redes sociales
                </h4>
                <div className="flex items-center gap-3">
                  {s.footer.instagram && (
                    <a href={s.footer.instagram.startsWith('http') ? s.footer.instagram : `https://instagram.com/${s.footer.instagram.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {s.footer.facebook && (
                    <a href={s.footer.facebook.startsWith('http') ? s.footer.facebook : `https://facebook.com/${s.footer.facebook}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {s.footer.tiktok && (
                    <a href={s.footer.tiktok.startsWith('http') ? s.footer.tiktok : `https://tiktok.com/${s.footer.tiktok.replace('@', '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <TikTokIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
                <p style={{ ...bodyStyle, opacity: 0.5 }} className="text-xs mt-6">
                  Powered by Reserva Unica
                </p>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${theme.footer_text_color}15` }} className="pt-6 text-center">
              <p style={{ ...bodyStyle, opacity: 0.4 }} className="text-xs">
                {s.footer.copyright || `\u00A9 ${new Date().getFullYear()} ${landing.slug}. Todos los derechos reservados.`}
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER SUB-COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface HeaderProps {
  s: LandingSections;
  theme: LandingTheme;
  ts: TemplateStyles;
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  landing: LandingPageType;
  isPreview?: boolean;
}

function Header({ s, theme, ts, scrolled, mobileMenuOpen, setMobileMenuOpen, handleSmoothScroll, headingStyle, bodyStyle, landing, isPreview }: HeaderProps) {
  const headerBg = (() => {
    if (ts.headerStyle === 'solid') {
      return scrolled
        ? theme.bg_color
        : theme.bg_color;
    }
    if (ts.headerStyle === 'gradient') {
      return scrolled
        ? theme.primary_color
        : `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})`;
    }
    return scrolled ? theme.bg_color : 'transparent';
  })();

  const headerTextColor = (() => {
    if (ts.headerStyle === 'gradient' && !scrolled) return '#ffffff';
    if (ts.headerStyle === 'transparent' && !scrolled) return '#ffffff';
    return theme.text_color;
  })();

  const isTransparent = ts.headerStyle === 'transparent' && !scrolled;

  return (
    <header className={`${isPreview ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}
      style={{
        backgroundColor: scrolled || ts.headerStyle === 'gradient' ? headerBg : 'transparent',
        backgroundImage: !scrolled && ts.headerStyle === 'gradient' ? headerBg : 'none',
        color: headerTextColor,
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#inicio" onClick={handleSmoothScroll} className="flex items-center gap-3 shrink-0">
            {landing.logo_url ? (
              <img src={landing.logo_url} alt="" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                style={{ filter: isTransparent || ts.headerStyle === 'gradient' ? 'brightness(0) invert(1)' : 'none' }} />
            ) : (
              <span style={{ ...headingStyle, color: headerTextColor }} className="font-bold text-lg">
                {landing.slug}
              </span>
            )}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {(s.header.menu_items || []).map((item, i) => (
              <a key={i} href={item.href} onClick={handleSmoothScroll}
                style={{ ...bodyStyle, color: headerTextColor }}
                className="px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity rounded-lg">
                {item.label}
              </a>
            ))}
            {s.header.cta_text && (
              <a href="#contacto" onClick={handleSmoothScroll}
                className={`ml-3 inline-flex items-center px-5 py-2.5 ${ts.buttonRadius} text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]`}
                style={{
                  backgroundColor: isTransparent || ts.headerStyle === 'gradient' ? 'rgba(255,255,255,0.2)' : theme.button_color,
                  color: isTransparent || ts.headerStyle === 'gradient' ? '#ffffff' : '#ffffff',
                }}>
                {s.header.cta_text}
              </a>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: headerTextColor }}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t"
          style={{
            backgroundColor: theme.bg_color,
            borderColor: `${theme.text_color}10`,
          }}>
          <div className="px-4 py-4 space-y-1">
            {(s.header.menu_items || []).map((item, i) => (
              <a key={i} href={item.href} onClick={handleSmoothScroll}
                style={{ color: theme.text_color, ...bodyStyle }}
                className="block px-3 py-3 text-sm font-medium rounded-lg hover:bg-black/5 transition-colors">
                {item.label}
              </a>
            ))}
            {s.header.cta_text && (
              <a href="#contacto" onClick={handleSmoothScroll}
                className={`block text-center mt-3 px-5 py-3 ${ts.buttonRadius} text-sm font-semibold text-white transition-all`}
                style={{ backgroundColor: theme.button_color }}>
                {s.header.cta_text}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
