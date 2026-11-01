import { Construction, Wrench, MessageCircle, Mail } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';

interface MaintenancePageProps {
  maintenance: LandingSections['maintenance'];
  theme: LandingTheme;
  logoUrl?: string | null;
  footer?: LandingSections['footer'];
}

export function MaintenancePage({ maintenance: m, theme, logoUrl, footer }: MaintenancePageProps) {
  const isConstruction = m.mode === 'construction';
  const Icon = isConstruction ? Construction : Wrench;
  const whatsapp = footer?.whatsapp ? footer.whatsapp.replace(/\D/g, '') : '';
  const email = footer?.email || '';
  const accent = m.accent_color || '#10b981';

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-5 py-16"
      style={{ backgroundColor: m.bg_color || '#111827', color: m.text_color || '#ffffff' }}
    >
      {m.image_url && (
        <>
          <img src={m.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: m.bg_color || '#111827', opacity: 0.8 }} />
        </>
      )}

      <div className="relative z-10 w-full max-w-xl text-center">
        {m.show_logo && logoUrl && (
          <img
            src={logoUrl}
            alt=""
            className="mx-auto mb-8 h-20 w-20 rounded-full border-2 border-white/20 object-cover"
          />
        )}

        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-8 w-8" style={{ color: '#ffffff' }} />
        </div>

        <p
          className="mb-3 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: accent }}
        >
          {isConstruction ? 'En construcción' : 'En mantenimiento'}
        </p>

        <h1
          className="mb-4 text-3xl font-bold leading-tight sm:text-4xl"
          style={{ fontFamily: `'${theme.font_heading}', sans-serif` }}
        >
          {m.title}
        </h1>

        <p
          className="text-base leading-relaxed opacity-80 sm:text-lg"
          style={{ fontFamily: `'${theme.font_body}', sans-serif` }}
        >
          {m.message}
        </p>

        {m.extra_text && (
          <p className="mt-4 text-sm font-medium" style={{ color: accent }}>
            {m.extra_text}
          </p>
        )}

        {m.show_contact && (whatsapp || email) && (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent, color: '#ffffff' }}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ borderColor: accent, color: accent }}
              >
                <Mail className="h-4 w-4" />
                {email}
              </a>
            )}
          </div>
        )}

        <div className="mx-auto mt-10 h-px w-16 opacity-20" style={{ backgroundColor: m.text_color || '#ffffff' }} />

        <p
          className="mt-6 text-xs opacity-50"
          style={{ fontFamily: `'${theme.font_body}', sans-serif` }}
        >
          {footer?.copyright || `© ${new Date().getFullYear()}`}
        </p>
      </div>
    </div>
  );
}
