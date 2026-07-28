import { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  ChevronDown, ChevronRight, MapPin, Phone, Mail,
  Instagram, Facebook, ExternalLink, ArrowRight, Loader2,
  Star, Wrench, Palette, Zap, Shield, Clock, Heart, Award,
  CheckCircle, Globe, Users, TrendingUp, Target, Smile, Coffee,
  BookOpen, Camera, Music, Scissors, Dumbbell, Leaf, Sun, Moon,
  Droplets, Flame, Sparkles, Crown, Gem, Diamond, Triangle,
  Circle, Square, Hexagon, Pentagon,
} from 'lucide-react';
import type {
  LandingPage as LandingPageType,
  LandingTheme,
} from '../types';
import { DEFAULT_THEME } from '../config';
import { normalizeImages } from '../lib/landing-utils';
import { useLandingData } from '../hooks/useLandingData';
import { HeroSection } from '../sections/HeroSection';
import { AboutSection } from '../sections/AboutSection';
import { AboutTextSection } from '../sections/AboutTextSection';
import { MainServiceSection } from '../sections/MainServiceSection';
import { SecondaryServicesSection } from '../sections/SecondaryServicesSection';
import { WhyChooseUsSection } from '../sections/WhyChooseUsSection';
import { GallerySection } from '../sections/GallerySection';
import { Lightbox } from '../sections/Lightbox';
import { TestimonialsSection } from '../sections/TestimonialsSection';
import { FaqSection } from '../sections/FaqSection';
import { CtaSection } from '../sections/CtaSection';
import { MapSection } from '../sections/MapSection';
import { FooterSection } from '../sections/FooterSection';
import { MarketingPopup } from '../sections/MarketingPopup';
import { ShopInviteSection } from '../sections/ShopInviteSection';
import { Header } from '../sections/Header';
import { useModuleAccess, ModuleBlockedScreen } from '../../subscription';
import { cn } from '../../../lib/utils';

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

export function LandingPage({ initialData, isPreview, isEditing, selectedSection, onSelectSection }: {
  initialData?: LandingPageType; isPreview?: boolean;
  isEditing?: boolean; selectedSection?: string; onSelectSection?: (key: string) => void;
} = {}) {
  const { landing, loading, notFound, s, theme, seo, ts, hasSection, headingStyle, bodyStyle } = useLandingData({ initialData });
  const { isModuleEnabled } = useModuleAccess();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const SectionWrap = useCallback(({ sectionKey, children, className }: { sectionKey: string; children: ReactNode; className?: string }) => {
    if (!isEditing) return <>{children}</>;
    return (
      <div
        data-section-key={sectionKey}
        onClick={() => onSelectSection?.(sectionKey)}
        className={cn(
          'cursor-pointer relative',
          selectedSection === sectionKey && 'ring-2 ring-blue-500/50 ring-offset-2 rounded-lg',
          'hover:ring-1 hover:ring-blue-400/30 rounded-lg transition-all',
          className
        )}
      >
        {children}
        {selectedSection === sectionKey && (
          <div className="absolute top-2 right-2 z-50 flex items-center gap-1 rounded-lg bg-blue-500 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editando
          </div>
        )}
      </div>
    );
  }, [isEditing, selectedSection, onSelectSection]);

  useEffect(() => {
    if (isPreview) {
      const container = document.querySelector('[data-preview-container]');
      if (!container) return;
      const onScroll = () => setScrolled(container.scrollTop > 20);
      container.addEventListener('scroll', onScroll, { passive: true });
      return () => container.removeEventListener('scroll', onScroll);
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isPreview]);

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

  useEffect(() => {
    if (!s.seo_marketing) return;
    const g = s.seo_marketing.general || {};
    const soc = s.seo_marketing.social || {};
    const px = s.seo_marketing.pixel_analytics || {};
    const ver = s.seo_marketing.verification || {};
    const head = document.head;
    const metaEls: HTMLMetaElement[] = [];

    const addMeta = (attrs: Record<string, string>) => {
      const el = document.createElement('meta');
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      head.appendChild(el);
      metaEls.push(el);
    };

    if (g.meta_title) { document.title = g.meta_title; }
    if (g.meta_description) addMeta({ name: 'description', content: g.meta_description });
    if (g.keywords) addMeta({ name: 'keywords', content: g.keywords });
    if (g.robots) addMeta({ name: 'robots', content: g.robots });
    if (g.canonical_url) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', g.canonical_url);
      head.appendChild(link);
      metaEls.push(link as any);
    }
    if (g.og_title || g.meta_title) addMeta({ property: 'og:title', content: g.og_title || g.meta_title });
    if (g.og_description || g.meta_description) addMeta({ property: 'og:description', content: g.og_description || g.meta_description });
    if (g.og_image) addMeta({ property: 'og:image', content: g.og_image });
    if (g.og_type) addMeta({ property: 'og:type', content: g.og_type });
    if (g.og_locale) addMeta({ property: 'og:locale', content: g.og_locale });
    if (g.og_site_name) addMeta({ property: 'og:site_name', content: g.og_site_name });

    if (soc.twitter_card) addMeta({ name: 'twitter:card', content: soc.twitter_card });
    if (soc.twitter_site) addMeta({ name: 'twitter:site', content: soc.twitter_site });
    if (soc.twitter_creator) addMeta({ name: 'twitter:creator', content: soc.twitter_creator });
    if (soc.twitter_title || g.og_title) addMeta({ name: 'twitter:title', content: soc.twitter_title || g.og_title || g.meta_title });
    if (soc.twitter_description || g.og_description) addMeta({ name: 'twitter:description', content: soc.twitter_description || g.og_description || g.meta_description });
    if (soc.twitter_image || g.og_image) addMeta({ name: 'twitter:image', content: soc.twitter_image || g.og_image || '' });
    if (soc.fb_app_id) addMeta({ property: 'fb:app_id', content: soc.fb_app_id });

    if (ver.google_search_console) addMeta({ name: 'google-site-verification', content: ver.google_search_console });
    if (ver.bing_webmaster) addMeta({ name: 'msvalidate.01', content: ver.bing_webmaster });
    if (ver.yandex_webmaster) addMeta({ name: 'yandex-verification', content: ver.yandex_webmaster });
    if (ver.pinterest_verification) addMeta({ name: 'p:domain_verify', content: ver.pinterest_verification });
    if (ver.facebook_domain_verification) addMeta({ name: 'facebook-domain-verification', content: ver.facebook_domain_verification });

    const scriptEls: HTMLScriptElement[] = [];
    const addScript = (id: string, text: string) => {
      const el = document.createElement('script');
      el.id = id;
      el.innerHTML = text;
      head.appendChild(el);
      scriptEls.push(el);
    };

    if (px.google_analytics_id) {
      addScript('ga-script', `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create','${px.google_analytics_id}','auto');ga('send','pageview');`);
    }
    if (px.google_tag_manager_id) {
      addScript('gtm-script', `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${px.google_tag_manager_id}');`);
    }
    if (px.facebook_pixel_id) {
      addScript('fb-pixel', `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px.facebook_pixel_id}');fbq('track','PageView');`);
    }
    if (px.tiktok_pixel_id) {
      addScript('tt-pixel', `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(t){var e=ttq.anonymizeIP||1;ttq.page=ttq.page||{};var n=/^https?:\/\/[^/]+\/.*\/?collection\//.test(t);n?(ttq.load=function(t){var e="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._u=t;var n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=e+"?sdkid="+t+"&v="+(new Date).getTime();var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o);return ttq},ttq.load("${px.tiktok_pixel_id}")):ttq._u=t};var tt=window.analytics=window.analytics||[];ttq.load("${px.tiktok_pixel_id}");ttq.page();}(window,document,'ttq');`);
    }

    if (px.custom_head_scripts) {
      const wrapper = document.createElement('div');
      wrapper.id = 'seo-custom-head';
      wrapper.innerHTML = px.custom_head_scripts;
      head.appendChild(wrapper);
    }

    if (px.custom_body_scripts) {
      const wrapper = document.createElement('div');
      wrapper.id = 'seo-custom-body';
      wrapper.innerHTML = px.custom_body_scripts;
      document.body.appendChild(wrapper);
    }

    return () => {
      metaEls.forEach(el => el.remove());
      scriptEls.forEach(el => el.remove());
      document.getElementById('seo-custom-head')?.remove();
      document.getElementById('seo-custom-body')?.remove();
    };
  }, [s.seo_marketing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DEFAULT_THEME.bg_color }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: DEFAULT_THEME.primary_color }} />
      </div>
    );
  }

  if (notFound || !landing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DEFAULT_THEME.bg_color }}>
        <div className="text-center px-4">
          <h1 style={{ fontFamily: `'${DEFAULT_THEME.font_heading}', sans-serif`, color: DEFAULT_THEME.text_color, fontWeight: 300 }} className="text-3xl mb-2">
            Landing no encontrada
          </h1>
          <p style={{ fontFamily: `'${DEFAULT_THEME.font_body}', sans-serif`, color: '#666666' }}>
            Esta landing page no existe o no esta publicada.
          </p>
        </div>
      </div>
    );
  }

  if (!isPreview && !isModuleEnabled('landing')) {
    return <ModuleBlockedScreen moduleId="landing" />;
  }

  const galleryImages = normalizeImages(s.gallery.images || []).slice(0, 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bg_color, color: theme.text_color, ...bodyStyle }}>
      {seo.title && <title>{seo.title}</title>}
      {seo.description && <meta name="description" content={seo.description} />}
      {seo.og_image && <meta property="og:image" content={seo.og_image} />}

      {/* ─── HEADER + HERO ─── */}
      <SectionWrap sectionKey="header">
      {isPreview && hasSection('header') && hasSection('hero') ? (
        <div className="relative">
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
          {/* ─── HERO ─── */}
          <SectionWrap sectionKey="hero">
          <HeroSection
            s={s}
            theme={theme}
            ts={ts}
            landingLogoUrl={landing.logo_url}
            headingStyle={headingStyle}
            bodyStyle={bodyStyle}
            handleSmoothScroll={handleSmoothScroll}
          />
          </SectionWrap>
        </div>
      ) : (
        <>
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
            <SectionWrap sectionKey="hero">
            <HeroSection
              s={s}
              theme={theme}
              ts={ts}
              landingLogoUrl={landing.logo_url}
              headingStyle={headingStyle}
              bodyStyle={bodyStyle}
              handleSmoothScroll={handleSmoothScroll}
            />
            </SectionWrap>
          )}
        </>
      )}
      </SectionWrap>

      {/* ─── ABOUT ─── */}
      {hasSection('about') && s.about.description && (
        <SectionWrap sectionKey="about">
        <AboutSection
          about={s.about}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}

      {/* ─── ABOUT TEXT ─── */}
      {hasSection('about_text') && s.about_text && (
        <SectionWrap sectionKey="about_text">
        <AboutTextSection
          aboutText={s.about_text}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}

      {/* ─── MAIN SERVICE ─── */}
      {hasSection('main_service') && s.main_service.title && (
        <SectionWrap sectionKey="main_service">
        <MainServiceSection
          mainService={s.main_service}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          getIcon={getIcon}
        />
        </SectionWrap>
      )}

      {/* ─── SECONDARY SERVICES ─── */}
      {hasSection('secondary_services') && s.secondary_services.items.length > 0 && (
        <SectionWrap sectionKey="secondary_services">
        <SecondaryServicesSection
          secondaryServices={s.secondary_services}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          getIcon={getIcon}
        />
        </SectionWrap>
      )}

      {/* ─── WHY CHOOSE US ─── */}
      {hasSection('why_choose_us') && s.why_choose_us.items.length > 0 && (
        <SectionWrap sectionKey="why_choose_us">
        <WhyChooseUsSection
          whyChooseUs={s.why_choose_us}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          getIcon={getIcon}
        />
        </SectionWrap>
      )}

      {/* ─── GALLERY ─── */}
      {hasSection('gallery') && galleryImages.length > 0 && (
        <SectionWrap sectionKey="gallery">
        <GallerySection
          gallery={s.gallery}
          galleryImages={galleryImages}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          onImageClick={(i) => setLightboxIndex(i)}
        />
        </SectionWrap>
      )}

      {/* ─── LIGHTBOX ─── */}
      {lightboxIndex !== null && galleryImages.length > 0 && (
        <Lightbox
          galleryImages={galleryImages}
          lightboxIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % galleryImages.length)}
        />
      )}

      {/* ─── BANNER ─── */}
      {(s.banner.title || s.banner.subtitle || s.banner.image_url) && (
        <SectionWrap sectionKey="banner">
        <section className="relative py-32 sm:py-40 px-5 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: s.banner.image_url ? `url(${s.banner.image_url})` : undefined }}>
            {s.banner.image_url ? (
              <div className="absolute inset-0" style={{ backgroundColor: s.banner.overlay_color, opacity: s.banner.overlay_opacity / 100 }} />
            ) : (
              <div className="absolute inset-0" style={{ backgroundColor: s.banner.overlay_color }} />
            )}
          </div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {s.banner.title && (
              <h2 style={{ ...headingStyle, color: '#ffffff', fontWeight: 300, fontFamily: "'Dancing Script', cursive" }} className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
                {s.banner.title}
              </h2>
            )}
            {s.banner.subtitle && (
              <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)', fontFamily: "'Dancing Script', cursive" }} className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                {s.banner.subtitle}
              </p>
            )}
          </div>
        </section>
        </SectionWrap>
      )}

      {/* ─── TESTIMONIALS ─── */}
      {hasSection('testimonials') && s.testimonials.items.length > 0 && (
        <SectionWrap sectionKey="testimonials">
        <TestimonialsSection
          testimonials={s.testimonials}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}

      {/* ─── SHOP INVITE ─── */}
      {hasSection('shop_invite') && s.shop_invite && s.shop_invite.title && (
        <SectionWrap sectionKey="shop_invite">
        <ShopInviteSection
          shopInvite={s.shop_invite}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          shopUrl="/tienda"
        />
        </SectionWrap>
      )}

      {/* ─── FAQ ─── */}
      {hasSection('faq') && s.faq.items.length > 0 && (
        <SectionWrap sectionKey="faq">
        <FaqSection
          faq={s.faq}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}

      {/* ─── MAP ─── */}
      {(s.map.address || s.map.map_url) && (
        <SectionWrap sectionKey="map">
        <MapSection
          map={s.map}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}

      {/* ─── CTA ─── */}
      {hasSection('cta') && s.cta.title && (
        <SectionWrap sectionKey="cta">
        <CtaSection
          cta={s.cta}
          logoUrl={landing.logo_url}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          handleSmoothScroll={handleSmoothScroll}
        />
        </SectionWrap>
      )}

      {/* ─── FOOTER ─── */}
      {hasSection('footer') && (
        <SectionWrap sectionKey="footer">
        <FooterSection
          footer={s.footer}
          menuItems={s.header.menu_items || []}
          logoUrl={landing.logo_url}
          slug={landing.slug}
          theme={theme}
          ts={ts}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
          handleSmoothScroll={handleSmoothScroll}
        />
        </SectionWrap>
      )}

      {/* ─── MARKETING POPUP ─── */}
      {s.popup?.enabled && (
        <SectionWrap sectionKey="popup">
        <MarketingPopup
          popup={s.popup}
          theme={theme}
          headingStyle={headingStyle}
          bodyStyle={bodyStyle}
        />
        </SectionWrap>
      )}
    </div>
  );
}

