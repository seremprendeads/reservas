import { ChevronRight } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface FaqSectionProps {
  faq: LandingSections['faq'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

export function FaqSection({ faq, theme, ts, headingStyle, bodyStyle }: FaqSectionProps) {
  return (
    <section id="faq" className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`}>
      <div className="max-w-3xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {faq.title || 'Preguntas frecuentes'}
        </h2>
        <div className="space-y-3">
          {faq.items.map((item, i) => (
            <details key={i} className={`group ${ts.cardRadius} ${ts.cardShadow} overflow-hidden`}
              style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}06` }}>
              <summary style={{ ...headingStyle, color: theme.text_color, fontWeight: 500 }}
                className="flex items-center justify-center sm:justify-between p-6 cursor-pointer list-none select-none text-center sm:text-left gap-3 transition-colors hover:bg-black/[0.01]">
                {item.question}
                <ChevronRight className="h-5 w-5 shrink-ml-2 transition-transform duration-200 group-open:rotate-90"
                  style={{ color: '#a1a1aa' }} />
              </summary>
              <div style={{ ...bodyStyle, color: '#666666' }} className="px-6 pb-6 text-sm leading-relaxed text-center sm:text-left">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
