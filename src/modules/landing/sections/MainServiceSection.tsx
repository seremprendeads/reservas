import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';
import { fontSize } from '../lib/font-size';
import { textStyleExtras } from '../lib/text-style';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface MainServiceSectionProps {
  mainService: LandingSections['main_service'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  getIcon: (name: string) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function MainServiceSection({ mainService, theme, ts, headingStyle, bodyStyle, getIcon }: MainServiceSectionProps) {
  const Icon = mainService.icon ? getIcon(mainService.icon) : null;
  const iconSize = theme.main_service_icon_size ? `${theme.main_service_icon_size}px` : undefined;
  const iconColor = theme.main_service_icon_color || theme.service_icon_color;
  return (
    <section className={`relative ${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: mainService.background_image ? 'transparent' : theme.main_service_bg_color }}>
      <div className="max-w-5xl mx-auto text-center">
        {Icon && (
          <div
            className="inline-flex items-center justify-center w-24 h-24 mb-8"
            style={iconSize ? { width: `calc(${iconSize} + 3rem)`, height: `calc(${iconSize} + 3rem)` } : undefined}
          >
            <Icon className="h-12 w-12" style={{ color: iconColor, width: iconSize, height: iconSize }} />
          </div>
        )}
        <h2 style={{ ...headingStyle, fontWeight: 700, color: theme.main_service_title_color || undefined, fontSize: fontSize(theme.main_service_title_size), ...textStyleExtras(theme, 'main_service_title') }} className="text-4xl sm:text-5xl tracking-tight mb-6">
          {mainService.title}
        </h2>
        {mainService.subtitle && (
          <p style={{ ...bodyStyle, color: theme.main_service_subtitle_color || undefined, fontSize: fontSize(theme.main_service_subtitle_size), ...textStyleExtras(theme, 'main_service_subtitle') }} className="text-lg sm:text-xl leading-relaxed mb-4">
            {mainService.subtitle}
          </p>
        )}
        <p style={{ ...bodyStyle, color: theme.main_service_text_color || '#666666', fontSize: fontSize(theme.main_service_text_size), ...textStyleExtras(theme, 'main_service_text') }} className="text-base sm:text-lg leading-relaxed">
          {mainService.description}
        </p>
      </div>
    </section>
  );
}
