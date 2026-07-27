import { Star } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface TestimonialsSectionProps {
  testimonials: LandingSections['testimonials'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

export function TestimonialsSection({ testimonials, theme, ts, headingStyle, bodyStyle }: TestimonialsSectionProps) {
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: `${theme.text_color}03` }}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {testimonials.title || 'Testimonios'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.items.map((t, i) => (
            <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-8 text-center sm:text-left`}
              style={{ backgroundColor: theme.bg_color, border: `1px solid ${theme.text_color}06` }}>
              <div className="flex gap-0.5 mb-5 justify-center sm:justify-start">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4" style={{ color: j < t.rating ? '#f59e0b' : '#e5e7eb', fill: j < t.rating ? '#f59e0b' : 'none' }} />
                ))}
              </div>
              <p style={{ ...bodyStyle, color: '#666666' }} className="text-sm leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: theme.primary_color }}>
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ ...bodyStyle, color: theme.text_color, fontWeight: 500 }} className="text-sm">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
