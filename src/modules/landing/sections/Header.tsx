import { Menu, X } from 'lucide-react';
import type { LandingSections, LandingPage as LandingPageType, LandingTheme } from '../types';

type TemplateStyles = { headerStyle: string; buttonRadius: string };

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

export function Header({ s, theme, ts, scrolled, mobileMenuOpen, setMobileMenuOpen, handleSmoothScroll, headingStyle, bodyStyle, landing, isPreview }: HeaderProps) {
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
    <header className={`${isPreview ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'shadow-[0_1px_20px_rgba(0,0,0,0.06)]' : ''} ${scrolled ? 'backdrop-blur-xl' : ''}`}
      style={{
        backgroundColor: scrolled ? (ts.headerStyle === 'gradient' ? headerBg : 'rgba(255,255,255,0.92)') : 'transparent',
        backgroundImage: !scrolled && ts.headerStyle === 'gradient' ? headerBg : 'none',
        color: headerTextColor,
      }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Logo */}
          <a href="#inicio" onClick={handleSmoothScroll} className="flex items-center gap-3 shrink-0">
            {landing.logo_url ? (
              <img src={landing.logo_url} alt="" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover" />
            ) : (
              <span style={{ ...headingStyle, color: headerTextColor, fontWeight: 500 }} className="text-lg tracking-tight">
                {landing.slug}
              </span>
            )}
            {(s.header.logo_title || s.header.logo_description) && (
              <div className="hidden sm:block">
                {s.header.logo_title && (
                  <p style={{ ...headingStyle, color: headerTextColor }} className="text-sm leading-tight">{s.header.logo_title}</p>
                )}
                {s.header.logo_description && (
                  <p style={{ ...bodyStyle, color: headerTextColor }} className="text-xs leading-tight opacity-50">{s.header.logo_description}</p>
                )}
              </div>
            )}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {(s.header.menu_items || []).map((item, i) => (
              <a key={i} href={item.href} onClick={handleSmoothScroll}
                style={{ ...bodyStyle, color: headerTextColor }}
                className="px-4 py-2 text-sm font-medium opacity-60 hover:opacity-100 transition-all duration-150 rounded-lg hover:bg-black/[0.03]">
                {item.label}
              </a>
            ))}
            {s.header.cta_text && (
              <a href="#contacto" onClick={handleSmoothScroll}
                className={`ml-4 inline-flex items-center px-6 py-2.5 ${theme.button_border_radius} text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]`}
                style={{
                  backgroundColor: isTransparent || ts.headerStyle === 'gradient' ? 'rgba(255,255,255,0.15)' : theme.button_color,
                  color: '#ffffff',
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
        <div className="md:hidden border-t backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderColor: `${theme.text_color}0a`,
          }}>
          <div className="px-5 py-5 space-y-1">
            {(s.header.menu_items || []).map((item, i) => (
              <a key={i} href={item.href} onClick={handleSmoothScroll}
                style={{ color: theme.text_color, ...bodyStyle }}
                className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-black/[0.03] transition-colors">
                {item.label}
              </a>
            ))}
            {s.header.cta_text && (
              <a href="#contacto" onClick={handleSmoothScroll}
                className={`block text-center mt-3 px-5 py-3 ${theme.button_border_radius} text-sm font-semibold text-white transition-all`}
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
