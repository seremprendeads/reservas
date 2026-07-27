import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BioProfile, BioLink } from '../types';

const ICON_MAP: Record<string, string> = {};

function getButtonRadius(style: string) {
  if (style === 'pill') return '9999px';
  if (style === 'square') return '4px';
  return '16px';
}

export function BioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [bookingBgColor, setBookingBgColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: biz } = await supabase.from('businesses').select('id').eq('slug', slug).eq('is_active', true).maybeSingle();
      if (!biz) { setNotFound(true); setLoading(false); return; }

      const { data: p } = await supabase.from('bio_profiles').select('*').eq('business_id', biz.id).eq('is_active', true).maybeSingle();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p);

      const { data: l } = await supabase.from('bio_links').select('*').eq('profile_id', p.id).eq('is_active', true).order('sort_order');
      if (l) setLinks(l);

      const { data: branding } = await supabase.from('branding').select('background_color').eq('business_id', biz.id).maybeSingle();
      if (branding?.background_color) setBookingBgColor(branding.background_color);

      setLoading(false);

      supabase.from('bio_stats').insert({ profile_id: p.id, event_type: 'visit' });
    })();
  }, [slug]);

  const trackClick = (linkId: string) => {
    if (profile) {
      supabase.from('bio_stats').insert({ profile_id: profile.id, event_type: 'click', link_id: linkId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white/50">
          <p className="text-lg font-medium">Página no encontrada</p>
          <p className="text-sm mt-1">Esta bio no existe o fue desactivada.</p>
        </div>
      </div>
    );
  }

  const bgStyle: React.CSSProperties = profile.bg_type === 'gradient'
    ? { background: `linear-gradient(135deg, ${profile.bg_gradient_from}, ${profile.bg_gradient_to})` }
    : profile.bg_type === 'image' && profile.bg_image_url
    ? { background: `url(${profile.bg_image_url}) center/cover no-repeat`, backgroundColor: profile.bg_solid_color }
    : { background: profile.bg_solid_color };

  const overlayOpacity = (profile.bg_opacity ?? 0) / 100;

  const textColor = isLight(bgStyle.background as string) && overlayOpacity < 0.4 ? '#1f2937' : '#ffffff';

  function SocialIcon({ name }: { name: string }) {
  const cls = 'w-5 h-5';
  const svgBase = `fill-current ${cls}`;
  switch (name) {
    case 'instagram':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.228.415.56.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.413 2.227-.217.56-.477.96-.896 1.382-.42.419-.822.679-1.382.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.413a3.73 3.73 0 01-1.382-.896 3.73 3.73 0 01-.896-1.382c-.164-.422-.36-1.057-.413-2.227C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.249-1.805.413-2.227a3.73 3.73 0 01.896-1.382A3.73 3.73 0 014.93 2.74c.422-.164 1.057-.36 2.227-.413C8.414 2.175 8.794 2.163 12 2.163zM12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.902.333 4.14.63a5.87 5.87 0 00-2.126 1.384A5.87 5.87 0 00.63 4.14C.333 4.902.13 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.058 1.277.261 2.15.558 2.913.306.748.726 1.376 1.384 2.126a5.87 5.87 0 002.126 1.384c.764.297 1.636.5 2.913.558C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.913-.558a5.87 5.87 0 002.126-1.384 5.87 5.87 0 001.384-2.126c.297-.764.5-1.636.558-2.913C23.986 15.668 24 15.259 24 12s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.913a5.87 5.87 0 00-1.384-2.126A5.87 5.87 0 0019.86.63C19.098.333 18.225.13 16.947.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm7.846-10.405a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>;
    case 'tiktok':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46v-7.14a8.16 8.16 0 005.58 2.18V11.2a4.85 4.85 0 01-5.58-2.77V2h5.58v4.69z"/></svg>;
    case 'facebook':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
    case 'youtube':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    case 'twitter':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
    case 'linkedin':
      return <svg viewBox="0 0 24 24" className={svgBase}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
    default:
      return null;
  }
}

const socialLinks = [
    { url: profile.social_instagram, label: 'Instagram', name: 'instagram' },
    { url: profile.social_tiktok, label: 'TikTok', name: 'tiktok' },
    { url: profile.social_facebook, label: 'Facebook', name: 'facebook' },
    { url: profile.social_youtube, label: 'YouTube', name: 'youtube' },
    { url: profile.social_twitter, label: 'Twitter', name: 'twitter' },
    { url: profile.social_linkedin, label: 'LinkedIn', name: 'linkedin' },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen relative" style={bgStyle}>
      {overlayOpacity > 0 && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
      )}
      <meta property="og:title" content={profile.name} />
      <meta property="og:description" content={profile.description} />
      <meta property="og:type" content="website" />

      <div className="relative z-10 max-w-lg mx-auto px-8 py-16 flex flex-col items-center text-center" style={{ color: textColor }}>
        {/* Avatar */}
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name}
            className="w-28 h-28 rounded-full object-cover mb-6 border-4"
            style={{ borderColor: `${profile.primary_color}33`, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} />
        ) : (
          <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-6"
            style={{ background: profile.primary_color, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
            {(profile.name || 'N')[0]?.toUpperCase()}
          </div>
        )}

        {/* Name */}
        <h1 className="text-2xl font-bold tracking-tight" style={profile.title_color ? { color: profile.title_color } : undefined}>{profile.name}</h1>

        {/* Description */}
        {profile.description && (
          <p className="mt-3 text-base max-w-sm leading-relaxed" style={profile.description_color ? { color: profile.description_color, opacity: 0.8 } : { opacity: 0.7 }}>{profile.description}</p>
        )}

        {/* City */}
        {profile.city && (
          <p className="mt-2 text-xs tracking-wide uppercase" style={profile.description_color ? { color: profile.description_color, opacity: 0.6 } : { opacity: 0.5 }}>{profile.city}</p>
        )}

        {/* Social icons */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4 mt-5">
            {socialLinks.map(s => (
              <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-all duration-300 hover:scale-110"
                style={{ color: profile.social_icon_color || undefined }}>
                <SocialIcon name={s.name} />
              </a>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="w-full mt-8 space-y-4">
          {links.map((link, i) => {
            const isTienda = /tienda|shop/i.test(link.title);
            const bgColor = link.color || (isTienda && bookingBgColor) || profile.primary_color;
            return (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
                className="block w-full py-4 px-6 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                style={{
                  background: bgColor,
                  color: '#ffffff',
                  borderRadius: getButtonRadius(profile.button_style),
                  boxShadow: profile.button_shadow ? '0 4px 20px rgba(0,0,0,0.15)' : 'none',
                  animationDelay: `${i * 50}ms`,
                }}>
                {link.title}
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <a href="https://bookingbio.com" target="_blank" rel="noopener noreferrer" className="mt-12 inline-flex flex-col items-center gap-1 group">
          <span className="text-xl font-black tracking-tight opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: isLight(profile.primary_color) ? '#111' : '#fff' }}>
            Powered by BookingBio
          </span>
          <span className="text-[10px] tracking-widest opacity-30 group-hover:opacity-50 transition-opacity" style={{ color: isLight(profile.primary_color) ? '#111' : '#fff' }}>
            Tu Presencia Online
          </span>
        </a>
      </div>
    </div>
  );
}

function isLight(color: string): boolean {
  if (!color || color.startsWith('url')) return true;
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }
  return true;
}
