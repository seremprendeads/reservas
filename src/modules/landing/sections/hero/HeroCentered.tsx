import type { HeroCenteredData } from './types';
import type { LandingTheme } from '../../types';
import type { TEMPLATE_STYLES } from '../../config';
import { fontSize } from '../../lib/font-size';
import { textStyleExtras } from '../../lib/text-style';

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
  // El color de la sección (hero_*) pisa al que el propio Hero tenía guardado.
  const titleColor = theme.hero_title_color || data.title_color || '#ffffff';
  const subtitleColor = theme.hero_subtitle_color || data.subtitle_color || 'rgba(255,255,255,0.65)';
  const descriptionColor = theme.hero_text_color || data.description_color || 'rgba(255,255,255,0.5)';
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="relative min-h-screen flex items-center justify-center pt-24 pb-20">
        {data.background_image && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${data.background_image})` }}>
            <div className="absolute inset-0" style={{ backgroundColor: data.background_color, opacity: data.overlay_opacity / 100 }} />
          </div>
        )}
        {!data.background_image && (
          <div className="absolute inset-0" style={{ backgroundColor: data.background_color }} />
        )}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 sm:px-8">
          {data.logo_url && (
            <div className="mb-6 flex flex-col items-center gap-2">
              <img src={data.logo_url} alt="" className="h-12 sm:h-16 w-auto max-w-[220px] object-contain" />
              {data.logo_caption && (
                <span style={{ ...bodyStyle, color: data.logo_caption_color || 'rgba(255,255,255,0.5)', fontSize: data.logo_caption_size ? `${data.logo_caption_size}px` : undefined, fontWeight: data.logo_caption_weight || undefined, fontStyle: data.logo_caption_italic ? 'italic' : undefined, textTransform: (data.logo_caption_transform as React.CSSProperties['textTransform']) || undefined }} className="text-xs sm:text-sm tracking-wide">
                  {data.logo_caption}
                </span>
              )}
            </div>
          )}
          <h1
            style={{ ...headingStyle, color: titleColor, fontWeight: 700, fontSize: fontSize(theme.hero_title_size) || (data.title_size ? `${data.title_size}px` : undefined), ...textStyleExtras(theme, 'hero_title') }}
            className="text-5xl sm:text-6xl lg:text-8xl leading-[1.05] tracking-tight mb-8"
          >
            {data.title}
          </h1>
          <p
            style={{ ...bodyStyle, color: subtitleColor, fontSize: fontSize(theme.hero_subtitle_size) || (data.subtitle_size ? `${data.subtitle_size}px` : undefined), ...textStyleExtras(theme, 'hero_subtitle') }}
            className="text-lg sm:text-xl mb-4 max-w-2xl mx-auto leading-relaxed"
          >
            {data.subtitle}
          </p>
          {data.description && (
            <p
              style={{ ...bodyStyle, color: descriptionColor, fontSize: fontSize(theme.hero_text_size) || (data.description_size ? `${data.description_size}px` : undefined), ...textStyleExtras(theme, 'hero_text') }}
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
                style={{ backgroundColor: theme.button_color, color: theme.hero_primary_color || '#ffffff', fontSize: fontSize(theme.hero_primary_size), ...textStyleExtras(theme, 'hero_primary') }}
              >
                {data.primary_button_text}
              </a>
            )}
            {data.secondary_button_text && (
              <a
                href={data.secondary_button_url || '#nosotros'}
                onClick={handleSmoothScroll}
                className={`inline-flex items-center px-8 py-4 ${theme.button_border_radius} font-medium text-lg transition-all duration-200 border-2 border-white/25 text-white hover:border-white/50 hover:bg-white/[0.05]`}
                style={{ color: theme.hero_secondary_color || undefined, fontSize: fontSize(theme.hero_secondary_size), ...textStyleExtras(theme, 'hero_secondary') }}
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
