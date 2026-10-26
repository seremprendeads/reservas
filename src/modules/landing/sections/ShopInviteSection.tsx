import { ArrowRight } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';
import type { TemplateStyles } from '../hooks/useLandingData';
import { fontSize } from '../lib/font-size';
import { textStyleExtras } from '../lib/text-style';
import { ParallaxImage } from '../components/ParallaxImage';

interface ShopInviteSectionProps {
  shopInvite: LandingSections['shop_invite'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  shopUrl: string;
  parallax?: boolean;
}

export function ShopInviteSection({ shopInvite, theme, ts, headingStyle, bodyStyle, shopUrl, parallax = true }: ShopInviteSectionProps) {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-12 overflow-hidden">
      <ParallaxImage imageUrl={shopInvite.image_url} backgroundPosition={shopInvite.background_position} enabled={parallax}>
        {shopInvite.image_url ? (
          <div className="absolute inset-0" style={{ backgroundColor: shopInvite.overlay_color, opacity: shopInvite.overlay_opacity / 100 }} />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: shopInvite.overlay_color }} />
        )}
      </ParallaxImage>
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {shopInvite.title && (
          <h2 style={{ ...headingStyle, color: theme.shop_invite_title_color || '#ffffff', fontWeight: 300, fontFamily: "'Dancing Script', cursive", fontSize: fontSize(theme.shop_invite_title_size), ...textStyleExtras(theme, 'shop_invite_title') }} className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
            {shopInvite.title}
          </h2>
        )}
        {shopInvite.subtitle && (
          <p style={{ ...bodyStyle, color: theme.shop_invite_subtitle_color || 'rgba(255,255,255,0.7)', fontSize: fontSize(theme.shop_invite_subtitle_size), ...textStyleExtras(theme, 'shop_invite_subtitle') }} className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {shopInvite.subtitle}
          </p>
        )}
        {shopInvite.description && (
          <p style={{ ...bodyStyle, color: theme.shop_invite_text_color || 'rgba(255,255,255,0.5)', fontSize: fontSize(theme.shop_invite_text_size), ...textStyleExtras(theme, 'shop_invite_text') }} className="text-base max-w-2xl mx-auto leading-relaxed mt-4">
            {shopInvite.description}
          </p>
        )}
        {shopInvite.button_text && (
          <a
            href={shopUrl}
            className={`inline-flex items-center gap-2 mt-8 px-8 py-4 text-sm font-black uppercase tracking-wider text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] ${ts.buttonRadius}`}
            style={{
              backgroundColor: theme.shop_invite_button_bg || theme.button_color || theme.primary_color,
              color: theme.shop_invite_button_color || undefined,
              fontSize: fontSize(theme.shop_invite_button_size),
              ...textStyleExtras(theme, 'shop_invite_button'),
            }}
          >
            {shopInvite.button_text}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </section>
  );
}
