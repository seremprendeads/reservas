import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';
import { fontSize } from '../lib/font-size';
import { textStyleExtras } from '../lib/text-style';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface PlansSectionProps {
  plans: LandingSections['plans'];
  whatsapp: string;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  getIcon: (name: string) => React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

// Mismo formato que FloatingWhatsApp.tsx: si no arranca con el código de
// Argentina (54) se lo agrega, para que el negocio pueda cargar el número
// como lo tenga guardado (con o sin 54 adelante).
function whatsappLinkFor(phone: string, message: string): string {
  const clean = phone.replace(/[\s\-()+]/g, '');
  const withCountry = clean.startsWith('54') ? clean : `54${clean}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function PlansSection({ plans, whatsapp, theme, ts, headingStyle, bodyStyle, getIcon }: PlansSectionProps) {
  if (!plans.items.length) return null;

  return (
    <section id="planes" className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: theme.plans_bg_color }}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700, color: theme.plans_title_color || theme.text_color, fontSize: fontSize(theme.plans_title_size), ...textStyleExtras(theme, 'plans_title') }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {plans.title || 'Elegí tu plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.items.map((plan, i) => {
            const bg = plan.bg_color || theme.plans_card_bg_color;
            const text = plan.text_color || theme.text_color;
            const button = plan.button_color || theme.primary_color;
            return (
              <div key={i} className={`${ts.cardRadius} ${ts.cardShadow} p-8 flex flex-col transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5`}
                style={{ backgroundColor: bg }}>
                <h3 style={{ ...headingStyle, fontWeight: 700, color: button, fontSize: fontSize(theme.plans_title_size), ...textStyleExtras(theme, 'plans_title') }} className="text-xl mb-3">
                  {plan.name}
                </h3>
                {plan.detail && (
                  <p style={{ ...bodyStyle, color: text, opacity: 0.75, fontSize: fontSize(theme.plans_text_size), ...textStyleExtras(theme, 'plans_text') }} className="text-sm leading-relaxed flex-1 mb-5 whitespace-pre-line">
                    {plan.detail}
                  </p>
                )}
                {!!plan.features?.length && (
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature, fi) => {
                      const Icon = getIcon(feature.icon);
                      return (
                        <li key={fi} className="flex items-center gap-3 text-sm" style={{ color: text, ...bodyStyle }}>
                          <Icon className="h-4 w-4 shrink-0" style={{ color: button }} />
                          <span className="flex-1 leading-snug">{feature.text}</span>
                          {feature.price && <span className="shrink-0 font-medium whitespace-nowrap">{feature.price}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {plan.total && (
                  <div className="flex items-center justify-between gap-3 border-t pt-4 mb-6" style={{ borderColor: `${text}1a`, color: text }}>
                    <span className="text-sm font-medium">Total</span>
                    <span style={{ ...headingStyle, color: button, fontWeight: 700, fontSize: fontSize(theme.plans_title_size) }}>{plan.total}</span>
                  </div>
                )}
                {whatsapp && (
                  <a href={whatsappLinkFor(whatsapp, `Hola! Quiero reservar el plan "${plan.name}"`)} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-6 py-3 ${theme.button_border_radius} font-medium text-sm text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                    style={{ backgroundColor: button }}>
                    {plan.button_text || 'Reservar'}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
