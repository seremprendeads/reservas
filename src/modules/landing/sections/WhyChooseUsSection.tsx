import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';
import { fontSize } from '../lib/font-size';
import { textStyleExtras } from '../lib/text-style';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface WhyChooseUsSectionProps {
  whyChooseUs: LandingSections['why_choose_us'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  getIcon: (name: string) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export function WhyChooseUsSection({ whyChooseUs, theme, ts, headingStyle, bodyStyle, getIcon }: WhyChooseUsSectionProps) {
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: theme.why_choose_us_bg_color }}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700, color: theme.why_choose_us_title_color || undefined, fontSize: fontSize(theme.why_choose_us_title_size), ...textStyleExtras(theme, 'why_choose_us_title') }} className={`text-4xl sm:text-5xl tracking-tight text-center ${whyChooseUs.subtitle ? 'mb-4' : 'mb-16'}`}>
          {whyChooseUs.title || 'Por que elegirnos'}
        </h2>
        {whyChooseUs.subtitle && (
          <p style={{ ...bodyStyle, color: theme.why_choose_us_subtitle_color || undefined, fontSize: fontSize(theme.why_choose_us_subtitle_size), ...textStyleExtras(theme, 'why_choose_us_subtitle') }} className="text-lg text-center mb-16">
            {whyChooseUs.subtitle}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.items.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-8 text-center transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5`}
                style={{ backgroundColor: theme.why_choose_us_card_bg_color, border: `1px solid ${theme.text_color}06` }}>
                {item.icon && (
                  <div className="inline-flex items-center justify-center w-24 h-24 mb-5">
                    <Icon className="h-12 w-12" style={{ color: theme.why_choose_us_icon_color }} />
                  </div>
                )}
                {item.title && (
                  <p
                    style={{ ...headingStyle, color: theme.why_choose_us_item_title_color || theme.why_choose_us_title_color || undefined, fontSize: fontSize(theme.why_choose_us_item_title_size), ...textStyleExtras(theme, 'why_choose_us_item_title') }}
                    className="text-lg font-semibold leading-snug mb-1"
                  >
                    {item.title}
                  </p>
                )}
                {item.subtitle && (
                  <p
                    style={{ ...bodyStyle, color: theme.why_choose_us_subtitle_color || theme.text_color, fontSize: fontSize(theme.why_choose_us_item_subtitle_size) || fontSize(theme.why_choose_us_subtitle_size), ...textStyleExtras(theme, 'why_choose_us_item_subtitle') }}
                    className="text-sm leading-relaxed mb-2"
                  >
                    {item.subtitle}
                  </p>
                )}
                {item.text && (
                  <p
                    style={{ ...bodyStyle, color: theme.why_choose_us_text_color || theme.text_color, fontSize: fontSize(theme.why_choose_us_text_size), ...textStyleExtras(theme, 'why_choose_us_text') }}
                    className={item.title ? 'text-sm leading-relaxed' : 'text-sm font-medium leading-relaxed'}
                  >
                    {item.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
