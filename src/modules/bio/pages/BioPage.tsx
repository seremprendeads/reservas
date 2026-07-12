import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BioProfile, BioLink } from '../types';

const ICON_MAP: Record<string, string> = {
  'calendar': '📅', 'shopping-bag': '🛍️', 'message-circle': '💬', 'instagram': '📸',
  'facebook': '👤', 'twitter': '🐦', 'youtube': '▶️', 'music': '🎵', 'video': '🎬',
  'map-pin': '📍', 'phone': '📞', 'mail': '✉️', 'globe': '🌐', 'file-text': '📄',
  'linkedin': '💼', 'star': '⭐', 'link': '🔗', 'tiktok': '🎵',
};

function getButtonRadius(style: string) {
  if (style === 'pill') return '9999px';
  if (style === 'square') return '12px';
  return '16px';
}

export function BioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: p } = await supabase.from('bio_profiles').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p);

      const { data: l } = await supabase.from('bio_links').select('*').eq('profile_id', p.id).eq('is_active', true).order('sort_order');
      if (l) setLinks(l);
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

  const textColor = isLight(bgStyle.background as string) ? '#1f2937' : '#ffffff';

  const socialLinks = [
    { url: profile.social_instagram, label: 'Instagram', icon: '📸' },
    { url: profile.social_tiktok, label: 'TikTok', icon: '🎵' },
    { url: profile.social_facebook, label: 'Facebook', icon: '👤' },
    { url: profile.social_youtube, label: 'YouTube', icon: '▶️' },
    { url: profile.social_twitter, label: 'Twitter', icon: '🐦' },
    { url: profile.social_linkedin, label: 'LinkedIn', icon: '💼' },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen" style={bgStyle}>
      <meta property="og:title" content={profile.name} />
      <meta property="og:description" content={profile.description} />
      <meta property="og:type" content="website" />

      <div className="max-w-lg mx-auto px-6 py-12 flex flex-col items-center text-center" style={{ color: textColor }}>
        {/* Avatar */}
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name}
            className="w-24 h-24 rounded-full object-cover shadow-lg mb-4 border-2"
            style={{ borderColor: `${profile.primary_color}33` }} />
        ) : (
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4"
            style={{ background: profile.primary_color }}>
            {(profile.name || 'N')[0]?.toUpperCase()}
          </div>
        )}

        {/* Name */}
        <h1 className="text-2xl font-bold">{profile.name}</h1>

        {/* Description */}
        {profile.description && (
          <p className="mt-2 text-sm opacity-70 max-w-sm">{profile.description}</p>
        )}

        {/* City */}
        {profile.city && (
          <p className="mt-1 text-xs opacity-50">📍 {profile.city}</p>
        )}

        {/* Social icons */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mt-4">
            {socialLinks.map(s => (
              <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer"
                className="text-xl opacity-60 hover:opacity-100 transition-opacity">
                {s.icon}
              </a>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="w-full mt-8 space-y-3">
          {links.map((link, i) => (
            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
              onClick={() => trackClick(link.id)}
              className="block w-full py-3.5 px-5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:brightness-110"
              style={{
                background: link.color || profile.primary_color,
                color: '#ffffff',
                borderRadius: getButtonRadius(profile.button_style),
                boxShadow: profile.button_shadow ? '0 4px 14px rgba(0,0,0,0.12)' : 'none',
                animationDelay: `${i * 50}ms`,
              }}>
              <span className="mr-2">{ICON_MAP[link.icon || 'link'] || '🔗'}</span>
              {link.title}
            </a>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-10 text-[10px] opacity-30">
          Powered by Reserva Única
        </p>
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
