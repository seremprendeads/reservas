import { useState, useEffect } from 'react';
import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface AboutSectionProps {
  about: LandingSections['about'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

export function AboutSection({ about, theme, ts, headingStyle, bodyStyle }: AboutSectionProps) {
  const isMobile = useIsMobile();
  const textAlign = isMobile ? 'center' : (about.alignment || 'left');

  return (
    <section id="nosotros" className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ borderTop: `1px solid ${theme.text_color}08` }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {about.image_url && (
          <div className={`${ts.cardRadius} overflow-hidden ${ts.cardShadow}`}>
            <img src={about.image_url} alt={about.title} className="w-full h-80 sm:h-96 object-cover" />
          </div>
        )}
        <div style={{ textAlign }}>
          <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight mb-8">
            {about.title || 'Sobre nosotros'}
          </h2>
          <p style={{ ...bodyStyle, color: '#666666' }} className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {about.description}
          </p>
        </div>
      </div>
    </section>
  );
}
