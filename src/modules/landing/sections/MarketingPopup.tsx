import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';

interface MarketingPopupProps {
  popup: LandingSections['popup'];
  theme: LandingTheme;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

const DISMISSED_KEY = 'landing_popup_dismissed';

export function MarketingPopup({ popup, theme, headingStyle, bodyStyle }: MarketingPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!popup?.enabled || sessionStorage.getItem(DISMISSED_KEY)) return;

    const target = document.querySelector('[data-preview-container]');
    const scrollEl = target || window;

    const checkScroll = () => {
      const pct = target
        ? (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
        : (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (pct > 30) {
        setVisible(true);
        scrollEl.removeEventListener('scroll', checkScroll);
      }
    };

    scrollEl.addEventListener('scroll', checkScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', checkScroll);
  }, [popup?.enabled]);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!popup?.enabled || !visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <button
        onClick={close}
        className="absolute top-6 right-6 z-[10000] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition-all hover:bg-white hover:scale-110"
      >
        <X className="h-5 w-5" />
      </button>

      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {popup.image_url && (
          <div className="absolute inset-0">
            <img src={popup.image_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: popup.overlay_color, opacity: popup.overlay_opacity / 100 }} />
          </div>
        )}

        {!popup.image_url && (
          <div className="absolute inset-0" style={{ backgroundColor: popup.overlay_color || theme.primary_color }} />
        )}

        <div className="relative z-10 p-8 sm:p-10 pt-12 text-center">
          {popup.title && (
            <h3 style={{ ...headingStyle, color: '#ffffff', fontWeight: 600 }} className="text-2xl sm:text-3xl mb-2">
              {popup.title}
            </h3>
          )}
          {popup.subtitle && (
            <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.8)' }} className="text-sm sm:text-base mb-4">
              {popup.subtitle}
            </p>
          )}
          {popup.description && (
            <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)' }} className="text-sm leading-relaxed mb-6">
              {popup.description}
            </p>
          )}
          {popup.button_text && (
            <a
              href={popup.button_url || '#'}
              onClick={close}
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
              style={{ backgroundColor: theme.button_color || theme.primary_color }}
            >
              {popup.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
