import type { LandingSections, LandingTheme } from '../types';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface PlansSectionProps {
  plans: LandingSections['plans'];
  whatsapp: string;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

// Mismo formato que FloatingWhatsApp.tsx: si no arranca con el código de
// Argentina (54) se lo agrega, para que el negocio pueda cargar el número
// como lo tenga guardado (con o sin 54 adelante).
function whatsappLinkFor(phone: string, message: string): string {
  const clean = phone.replace(/[\s\-()+]/g, '');
  const withCountry = clean.startsWith('54') ? clean : `54${clean}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function PlansSection({ plans, whatsapp, theme, ts, headingStyle, bodyStyle }: PlansSectionProps) {
  if (!plans.items.length) return null;

  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: theme.plans_bg_color }}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700, color: theme.text_color }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
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
                <h3 style={{ ...headingStyle, fontWeight: 700, color: button }} className="text-xl mb-3">
                  {plan.name}
                </h3>
                <p style={{ ...bodyStyle, color: text, opacity: 0.75 }} className="text-sm leading-relaxed flex-1 mb-6 whitespace-pre-line">
                  {plan.detail}
                </p>
                {whatsapp && (
                  <a href={whatsappLinkFor(whatsapp, `Hola! Quiero consultar por el plan "${plan.name}"`)} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-6 py-3 ${theme.button_border_radius} font-medium text-sm text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                    style={{ backgroundColor: button }}>
                    Consultar
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
