import { Check } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';
import { PLAN_CARDS, linkDePlan } from '../../subscription/lib/plans';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface PlansSectionProps {
  plans: LandingSections['plans'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

export function PlansSection({ plans, theme, ts, headingStyle, bodyStyle }: PlansSectionProps) {
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {plans.title || 'Elegí tu plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAN_CARDS.map((plan) => (
            <div key={plan.key} className={`${ts.cardRadius} ${ts.cardShadow} p-8 flex flex-col transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5`}
              style={{ backgroundColor: plan.bg, border: `1px solid ${plan.border}` }}>
              <h3 style={{ ...headingStyle, fontWeight: 700, color: plan.button }} className="text-xl mb-3">
                {plan.name}
              </h3>
              <p style={{ ...bodyStyle, color: '#4b4b4b' }} className="text-sm leading-relaxed flex-1 mb-6">
                <Check className="inline h-4 w-4 mr-1.5 -mt-0.5" style={{ color: plan.button }} />
                {plan.detail}
              </p>
              <a href={linkDePlan(plan)} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center justify-center px-6 py-3 ${theme.button_border_radius} font-medium text-sm text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                style={{ backgroundColor: plan.button }}>
                Contratar
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
