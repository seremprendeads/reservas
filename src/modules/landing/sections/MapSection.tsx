import { MapPin } from 'lucide-react';
import type { LandingSections, LandingTheme } from '../types';

type TemplateStyles = { sectionSpacing: string; cardRadius: string };

interface MapSectionProps {
  map: LandingSections['map'];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
}

function extractSrc(htmlOrUrl: string): string {
  const match = htmlOrUrl.match(/src="([^"]+)"/);
  if (match) return match[1];
  return htmlOrUrl;
}

function getEmbedUrl(map: LandingSections['map']): string | null {
  if (map.map_url) {
    let url = extractSrc(map.map_url);
    if (url.includes('/maps/embed') || url.includes('output=embed')) return url;
    const placeMatch = url.match(/maps\?.*q=([^&]+)/);
    if (placeMatch) return `https://www.google.com/maps?q=${placeMatch[1]}&output=embed`;
    const pathMatch = url.match(/maps\/place\/([^/]+)/);
    if (pathMatch) return `https://www.google.com/maps?q=${encodeURIComponent(pathMatch[1])}&output=embed`;
    return url;
  }
  if (!map.address) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(map.address)}&output=embed`;
}

export function MapSection({ map, theme, ts, headingStyle, bodyStyle }: MapSectionProps) {
  const embedUrl = getEmbedUrl(map);
  if (!embedUrl) return null;

  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`} style={{ backgroundColor: theme.bg_color }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <MapPin className="h-7 w-7 mx-auto mb-4" style={{ color: theme.primary_color }} />
          <h2 style={{ ...headingStyle, color: theme.text_color, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight mb-3">
            ¿Dónde estamos?
          </h2>
          {map.address && (
            <p style={{ ...bodyStyle, color: '#666666' }} className="text-sm">
              {map.address}
            </p>
          )}
        </div>
        <div className={`${ts.cardRadius} overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación del negocio"
          />
        </div>
      </div>
    </section>
  );
}
