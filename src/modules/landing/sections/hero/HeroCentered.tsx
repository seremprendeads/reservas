import type { HeroCenteredData } from './types';
import type { LandingTheme } from '../../types';
import type { TEMPLATE_STYLES } from '../../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface HeroCenteredProps {
  data: HeroCenteredData;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function HeroCentered({ data, theme, ts, headingStyle, bodyStyle, handleSmoothScroll }: HeroCenteredProps) {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
        {data.background_image && (
          <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: `url(${data.background_image})` }}>
            <div className="absolute inset-0" style={{ backgroundColor: data.background_color, opacity: data.overlay_opacity / 100 }} />
          </div>
        )}
        {!data.background_image && (
          <div className="absolute inset-0" style={{ backgroundColor: data.background_color }} />
        )}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 sm:px-8">
          <h1
            style={{ ...headingStyle, color: '#ffffff', fontWeight: 700 }}
            className="text-5xl sm:text-6xl lg:text-8xl leading-[1.05] tracking-tight mb-8"
          >
            {data.title}
          </h1>
          <p
            style={{ ...bodyStyle, color: 'rgba(255,255,255,0.65)' }}
            className="text-lg sm:text-xl mb-4 max-w-2xl mx-auto leading-relaxed"
          >
            {data.subtitle}
          </p>
          {data.description && (
            <p
              style={{ ...bodyStyle, color: 'rgba(255,255,255,0.5)' }}
              className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {data.description}
            </p>
          )}
          {!data.description && <div className="mb-12" />}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {data.primary_button_text && (
              <a
                href={data.primary_button_url || '#contacto'}
                onClick={handleSmoothScroll}
                className={`inline-flex items-center px-8 py-4 ${theme.button_border_radius} font-medium text-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                style={{ backgroundColor: theme.button_color, color: '#ffffff' }}
              >
                {data.primary_button_text}
              </a>
            )}
            {data.secondary_button_text && (
              <a
                href={data.secondary_button_url || '#nosotros'}
                onClick={handleSmoothScroll}
                className={`inline-flex items-center px-8 py-4 ${theme.button_border_radius} font-medium text-lg transition-all duration-200 border-2 border-white/25 text-white hover:border-white/50 hover:bg-white/[0.05]`}
              >
                {data.secondary_button_text}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
