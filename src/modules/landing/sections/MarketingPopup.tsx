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

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col"
        style={{ backgroundColor: popup.overlay_color || theme.primary_color }}
      >
        {/* Cruz pegada al card */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-[10000] flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white transition-all hover:bg-black/50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Texto arriba */}
        {(popup.title || popup.subtitle || popup.description) && (
          <div className="px-6 pt-8 pb-4 text-center">
            {popup.title && (
              <h3 style={{ ...headingStyle, color: '#ffffff', fontWeight: 700 }} className="text-xl sm:text-2xl mb-1">
                {popup.title}
              </h3>
            )}
            {popup.subtitle && (
              <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.85)' }} className="text-sm sm:text-base">
                {popup.subtitle}
              </p>
            )}
            {popup.description && (
              <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)' }} className="text-xs leading-relaxed mt-1">
                {popup.description}
              </p>
            )}
          </div>
        )}

        {/* Imagen de Canva en el centro */}
        {popup.image_url && (
          <div className="w-full">
            <img src={popup.image_url} alt="" className="w-full object-cover" />
          </div>
        )}

        {/* Botón abajo */}
        {popup.button_text && (
          <div className="px-6 py-5 text-center">
            
              href={popup.button_url || '#'}
              onClick={close}
              className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white uppercase tracking-wider transition-all duration-200 hover:shadow-lg hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: theme.button_color || theme.primary_color, filter: 'brightness(1.2)' }}
            >
              {popup.button_text}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}