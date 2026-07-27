import { useState, useEffect } from 'react';
import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface AboutTextSectionProps {
  aboutText: LandingSections['about_text'];
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

export function AboutTextSection({ aboutText, theme, ts, headingStyle, bodyStyle }: AboutTextSectionProps) {
  const isMobile = useIsMobile();
  const alignment = isMobile ? 'center' : (aboutText.alignment || 'left');

  return (
    <section className="py-8 px-5 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {aboutText.title && (
          <h2 style={{ ...headingStyle, fontWeight: 700, textAlign: alignment }} className="text-4xl sm:text-5xl tracking-tight mb-8">
            {aboutText.title}
          </h2>
        )}
        {aboutText.text && (
          <p style={{ ...bodyStyle, color: '#666666', textAlign: alignment }}
            className="text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {aboutText.text}
          </p>
        )}
      </div>
    </section>
  );
}
