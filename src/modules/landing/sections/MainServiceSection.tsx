import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

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
  const Icon = getIcon(mainService.icon);
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: theme.main_service_bg_color }}>
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-8">
          <Icon className="h-12 w-12" style={{ color: theme.service_icon_color }} />
        </div>
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight mb-6">
          {mainService.title}
        </h2>
        <p style={{ ...bodyStyle, color: '#666666' }} className="text-base sm:text-lg leading-relaxed">
          {mainService.description}
        </p>
      </div>
    </section>
  );
}
