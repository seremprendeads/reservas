import { ArrowRight } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';

type TemplateStyles = { sectionSpacing: string; buttonRadius: string };

interface CtaSectionProps {
  cta: LandingSections['cta'];
  logoUrl: string | null;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function CtaSection({ cta, logoUrl, theme, ts, headingStyle, bodyStyle, handleSmoothScroll }: CtaSectionProps) {
  return (
    <section id="contacto" className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12 relative overflow-hidden`}
      style={{ backgroundColor: cta.image_url ? 'transparent' : theme.primary_color }}>
      {cta.image_url && (
        <>
          <div className="absolute inset-0">
            <img src={cta.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: cta.overlay_color, opacity: cta.overlay_opacity / 100 }} />
          </div>
        </>
      )}
      <div className="max-w-3xl mx-auto text-center relative z-10">
        {logoUrl && (
          <img src={logoUrl} alt="" className="h-20 w-20 rounded-full object-cover mx-auto mb-8" />
        )}
        <h2 style={{ ...headingStyle, color: '#ffffff', fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight mb-6">
          {cta.title}
        </h2>
        <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)' }} className="text-base sm:text-lg mb-10 leading-relaxed">
          {cta.description}
        </p>
        <a href="#contacto" onClick={handleSmoothScroll}
          className={`inline-flex items-center px-10 py-5 ${theme.button_border_radius} font-medium text-lg text-white transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
          style={{
            background: `linear-gradient(135deg, ${theme.button_color}, ${theme.secondary_color})`,
            boxShadow: `0 8px 30px ${theme.button_color}30`,
          }}>
          {cta.button_text || 'Reservar ahora'}
          <ArrowRight className="h-5 w-5 ml-2" />
        </a>
      </div>
    </section>
  );
}
