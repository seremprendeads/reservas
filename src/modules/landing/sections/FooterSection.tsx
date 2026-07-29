import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';

type TemplateStyles = { buttonRadius: string; cardRadius: string };

function TikTokIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.16z" />
    </svg>
  );
}

function XIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface FooterSectionProps {
  footer: LandingSections['footer'];
  menuItems: { label: string; href: string }[];
  logoUrl: string | null;
  slug: string;
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  handleSmoothScroll: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function FooterSection({ footer, menuItems, logoUrl, slug, theme, ts, headingStyle, bodyStyle, handleSmoothScroll }: FooterSectionProps) {
  const footerBgColor = theme.footer_bg_color;
  const footerTextColor = theme.footer_text_color;

  return (
    <footer className="px-5 sm:px-8 lg:px-12 pt-20 pb-10" style={{ backgroundColor: footerBgColor, color: footerTextColor }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div className="text-center sm:text-left">
            {logoUrl && (
              <img src={logoUrl} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover mb-5 mx-auto sm:mx-0" />
            )}
            {(footer.logo_title || footer.logo_description) && (
              <div className="mb-3">
                {footer.logo_title && (
                  <p style={{ ...headingStyle, color: footerTextColor }} className="text-lg font-bold">{footer.logo_title}</p>
                )}
                {footer.logo_description && (
                  <p style={{ ...bodyStyle, color: footerTextColor }} className="text-sm opacity-50">{footer.logo_description}</p>
                )}
              </div>
            )}
            {footer.frases && (
              <p style={{ ...bodyStyle, color: footerTextColor }} className="text-base italic opacity-40 mt-3 leading-relaxed">{footer.frases}</p>
            )}
            {footer.copyright && (
              <p style={{ ...bodyStyle, opacity: 0.5 }} className="text-sm mt-4">{footer.copyright}</p>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h4 style={{ ...headingStyle, opacity: 0.4, fontWeight: 500 }} className="text-xs uppercase tracking-widest mb-5">
              Navegacion
            </h4>
            <nav className="space-y-2.5">
              {menuItems.map((item, i) => (
                <a key={i} href={item.href} onClick={handleSmoothScroll}
                  style={{ ...bodyStyle, opacity: 0.6 }}
                  className="block text-sm hover:opacity-100 transition-opacity duration-150">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="text-center sm:text-left">
            <h4 style={{ ...headingStyle, opacity: 0.4, fontWeight: 500 }} className="text-xs uppercase tracking-widest mb-5">
              Contacto
            </h4>
            <div className="space-y-3 inline-block text-center sm:text-left">
              {footer.address && (
                <div className="flex items-start justify-center sm:justify-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ opacity: 0.5 }} />
                  <span style={{ ...bodyStyle, opacity: 0.7 }} className="text-sm">{footer.address}</span>
                </div>
              )}
              {footer.phone && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Phone className="h-4 w-4 shrink-0" style={{ opacity: 0.5 }} />
                  <a href={`tel:${footer.phone}`} style={{ ...bodyStyle, opacity: 0.7 }} className="text-sm hover:opacity-100 transition-opacity duration-150">
                    {footer.phone}
                  </a>
                </div>
              )}
              {footer.email && (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="h-4 w-4 shrink-0" style={{ opacity: 0.5 }} />
                  <a href={`mailto:${footer.email}`} style={{ ...bodyStyle, opacity: 0.7 }} className="text-sm hover:opacity-100 transition-opacity duration-150">
                    {footer.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 style={{ ...headingStyle, opacity: 0.4, fontWeight: 500 }} className="text-xs uppercase tracking-widest mb-5">
              Redes sociales
            </h4>
            <div className="flex items-center justify-center sm:justify-start gap-4">
              {footer.instagram && (
                <a href={footer.instagram.startsWith('http') ? footer.instagram : `https://instagram.com/${footer.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="Instagram">
                  <Instagram className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
              {footer.facebook && (
                <a href={footer.facebook.startsWith('http') ? footer.facebook : `https://facebook.com/${footer.facebook}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="Facebook">
                  <Facebook className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
              {footer.x && (
                <a href={footer.x.startsWith('http') ? footer.x : `https://x.com/${footer.x.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="X">
                  <XIcon className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
              {footer.tiktok && (
                <a href={footer.tiktok.startsWith('http') ? footer.tiktok : `https://tiktok.com/${footer.tiktok.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="TikTok">
                  <TikTokIcon className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
              {footer.linkedin && (
                <a href={footer.linkedin.startsWith('http') ? footer.linkedin : `https://linkedin.com/in/${footer.linkedin.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="LinkedIn">
                  <LinkedInIcon className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
              {footer.youtube && (
                <a href={footer.youtube.startsWith('http') ? footer.youtube : `https://youtube.com/@${footer.youtube.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center transition-opacity duration-150 hover:opacity-100 opacity-60"
                  title="YouTube">
                  <YouTubeIcon className="h-5 w-5" style={{ color: theme.social_icon_color }} />
                </a>
              )}
            </div>
            <a href="https://bookingbio.com" target="_blank" rel="noopener noreferrer" className="inline-block mt-8 group">
              <span style={{ ...bodyStyle, color: footerTextColor }} className="text-sm font-black tracking-tight opacity-30 group-hover:opacity-60 transition-opacity">
                by BookingBio
              </span>
            </a>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${footerTextColor}10` }} className="pt-8 text-center">
          <p style={{ ...bodyStyle, opacity: 0.3 }} className="text-sm">
            {footer.copyright || `\u00A9 ${new Date().getFullYear()} ${slug}. Todos los derechos reservados.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
