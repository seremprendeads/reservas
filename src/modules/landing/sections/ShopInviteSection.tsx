import { ArrowRight } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';
import type { TemplateStyles } from '../hooks/useLandingData';

interface ShopInviteSectionProps {
  shopInvite: LandingSections['shop_invite'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  shopUrl: string;
}

export function ShopInviteSection({ shopInvite, theme, ts, headingStyle, bodyStyle, shopUrl }: ShopInviteSectionProps) {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-12 overflow-hidden">
      <div className="absolute inset-0 bg-fixed bg-cover bg-center" style={{ backgroundImage: shopInvite.image_url ? `url(${shopInvite.image_url})` : undefined }}>
        {shopInvite.image_url ? (
          <div className="absolute inset-0" style={{ backgroundColor: shopInvite.overlay_color, opacity: shopInvite.overlay_opacity / 100 }} />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: shopInvite.overlay_color }} />
        )}
      </div>
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {shopInvite.title && (
          <h2 style={{ ...headingStyle, color: '#ffffff', fontWeight: 300, fontFamily: "'Dancing Script', cursive" }} className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
            {shopInvite.title}
          </h2>
        )}
        {shopInvite.subtitle && (
          <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)' }} className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            {shopInvite.subtitle}
          </p>
        )}
        {shopInvite.button_text && (
          <a
            href={shopUrl}
            className={`inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] ${ts.buttonRadius}`}
            style={{ backgroundColor: theme.button_color || theme.primary_color }}
          >
            {shopInvite.button_text}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </section>
  );
}
