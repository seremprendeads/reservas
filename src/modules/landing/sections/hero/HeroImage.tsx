import { Sparkles } from 'lucide-react';
import type { HeroImageData } from './types';
import type { LandingTheme } from '../../types';
import type { TEMPLATE_STYLES } from '../../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface HeroImageProps {
  data: HeroImageData;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function HeroImage({ data, theme, ts, headingStyle, bodyStyle, handleSmoothScroll }: HeroImageProps) {
  const hasBgImage = !!data.background_image;

  return (
    <section id="inicio" className="relative overflow-hidden pt-24 pb-20 px-4">
      {hasBgImage && (
        <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: `url(${data.background_image})` }}>
          <div className="absolute inset-0" style={{ backgroundColor: data.background_color, opacity: data.overlay_opacity / 100 }} />
        </div>
      )}
      {!hasBgImage && (
        <div className="absolute inset-0" style={{ backgroundColor: data.background_color }} />
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Mobile: columna simple → texto, imagen, botones.
            Desktop (lg+): grilla 2x2 → texto y botones en la columna izquierda,
            imagen ocupando ambas filas a la derecha. */}
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-8">

          {/* TEXTO */}
          <div className="text-center sm:text-left lg:col-start-1 lg:row-start-1 lg:self-end">
            {data.logo_url && (
              <div className="mb-6 flex flex-col items-center sm:items-start gap-2">
                <img src={data.logo_url} alt="" className="h-12 sm:h-14 w-auto max-w-[200px] object-contain" />
                {data.logo_caption && (
                  <span style={{ ...bodyStyle, color: data.logo_caption_color || (hasBgImage ? 'rgba(255,255,255,0.5)' : '#888888'), fontSize: data.logo_caption_size ? `${data.logo_caption_size}px` : undefined }} className="text-xs sm:text-sm tracking-wide">
                    {data.logo_caption}
                  </span>
                )}
              </div>
            )}
            <h1 style={{ ...headingStyle, color: data.title_color || (hasBgImage ? '#ffffff' : theme.text_color), fontWeight: 700, fontSize: data.title_size ? `${data.title_size}px` : undefined }} className="text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-8">
              {data.title}
            </h1>
            <p style={{ ...bodyStyle, color: data.subtitle_color || (hasBgImage ? 'rgba(255,255,255,0.65)' : '#666666'), fontSize: data.subtitle_size ? `${data.subtitle_size}px` : undefined }} className="text-lg sm:text-xl mb-4 leading-relaxed">
              {data.subtitle}
            </p>
            {data.description && (
              <p style={{ ...bodyStyle, color: data.description_color || (hasBgImage ? 'rgba(255,255,255,0.5)' : '#888888'), fontSize: data.description_size ? `${data.description_size}px` : undefined }} className="text-lg sm:text-xl leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {/* IMAGEN */}
          <div className="relative lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
            {data.cover_image ? (
              <img
                src={data.cover_image}
                alt={data.title}
                className={`w-full ${ts.cardRadius} object-cover shadow-[0_8px_30px_rgba(0,0,0,0.08)]`}
                style={{ maxHeight: '520px', objectPosition: data.cover_position || '50% 50%' }}
              />
            ) : (
              <div
                className={`w-full ${ts.cardRadius} aspect-square flex items-center justify-center`}
                style={{ backgroundColor: hasBgImage ? 'rgba(255,255,255,0.06)' : `${theme.primary_color}08` }}
              >
                <Sparkles className="h-24 w-24" style={{ color: hasBgImage ? 'rgba(255,255,255,0.2)' : `${theme.primary_color}20` }} />
              </div>
            )}
          </div>

          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-4 lg:col-start-1 lg:row-start-2 lg:self-start">
            {data.primary_button_text && (
              <a
                href={data.primary_button_url || '#contacto'}
                onClick={handleSmoothScroll}
                className={`inline-flex items-center justify-center px-8 py-4 ${theme.button_border_radius} font-medium text-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                style={{ backgroundColor: theme.button_color, color: '#ffffff' }}
              >
                {data.primary_button_text}
              </a>
            )}
            {data.secondary_button_text && (
              <a
                href={data.secondary_button_url || '#nosotros'}
                onClick={handleSmoothScroll}
                className={`inline-flex items-center justify-center px-8 py-4 ${theme.button_border_radius} font-medium text-lg transition-all duration-200 border-2 ${hasBgImage ? 'border-white/25 text-white hover:border-white/50 hover:bg-white/[0.05]' : ''}`}
                style={!hasBgImage ? { borderColor: `${theme.primary_color}40`, color: theme.primary_color } : undefined}
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