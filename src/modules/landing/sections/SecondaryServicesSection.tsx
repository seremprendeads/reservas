import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface SecondaryServicesSectionProps {
  secondaryServices: LandingSections['secondary_services'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  getIcon: (name: string) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function SecondaryServicesSection({ secondaryServices, theme, ts, headingStyle, bodyStyle, getIcon }: SecondaryServicesSectionProps) {
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {secondaryServices.title || 'Servicios'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {secondaryServices.items.map((service, i) => {
            const Icon = getIcon(service.icon);
            return (
              <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-8 text-center transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5`}
                style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}06` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 mb-5">
                  <Icon className="h-6 w-6" style={{ color: theme.service_icon_color }} />
                </div>
                <h3 style={{ ...headingStyle, fontWeight: 500 }} className="text-lg mb-3">{service.title}</h3>
                <p style={{ ...bodyStyle, color: '#666666' }} className="text-sm leading-relaxed">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
