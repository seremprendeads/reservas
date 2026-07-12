import { useState, useEffect, useCallback } from 'react';
import {
  User, Link as LinkIcon, Palette, BarChart3, QrCode, Plus, Trash2,
  GripVertical, ExternalLink, Copy, Check, Loader2, Eye, EyeOff,
  Download,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { BioProfile, BioLink, BioStats } from '../types';
import { BIO_BUTTON_STYLES, BIO_BG_PRESETS } from '../config';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../../components/ui/dialog';

type Tab = 'profile' | 'links' | 'appearance' | 'stats' | 'qr';

const ICON_MAP: Record<string, string> = {
  'calendar': '📅', 'shopping-bag': '🛍️', 'message-circle': '💬', 'instagram': '📸',
  'facebook': '👤', 'twitter': '🐦', 'youtube': '▶️', 'music': '🎵', 'video': '🎬',
  'map-pin': '📍', 'phone': '📞', 'mail': '✉️', 'globe': '🌐', 'file-text': '📄',
  'linkedin': '💼', 'star': '⭐', 'link': '🔗', 'tiktok': '🎵',
};

function getButtonRadius(style: string) {
  if (style === 'pill') return 'rounded-full';
  if (style === 'square') return 'rounded-lg';
  return 'rounded-xl';
}

export function BioAdmin({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<BioProfile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [stats, setStats] = useState<BioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [editingLink, setEditingLink] = useState<BioLink | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('bio_profiles').select('*').eq('admin_email', adminEmail).maybeSingle();
    if (data) {
      setProfile(data);
      setSlug(data.slug);
      const { data: linkData } = await supabase.from('bio_links').select('*').eq('profile_id', data.id).order('sort_order');
      if (linkData) setLinks(linkData);
    }
    setLoading(false);
  }, [adminEmail]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const ensureProfile = async (): Promise<BioProfile> => {
    if (profile) return profile;
    const defaultSlug = adminEmail.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 30);
    const { data } = await supabase.from('bio_profiles').insert({
      admin_email: adminEmail,
      slug: defaultSlug,
      name: '',
    }).select().single();
    if (data) { setProfile(data); setSlug(data.slug); }
    return data!;
  };

  const updateProfile = async (fields: Partial<BioProfile>) => {
    const p = await ensureProfile();
    await supabase.from('bio_profiles').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', p.id);
    setProfile(prev => prev ? { ...prev, ...fields } as BioProfile : prev);
  };

  const loadStats = useCallback(async () => {
    if (!profile) return;
    const { data: allStats } = await supabase.from('bio_stats').select('*').eq('profile_id', profile.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
    if (!allStats) return;

    const visits = allStats.filter((s: Record<string, unknown>) => s.event_type === 'visit').length;
    const clicks = allStats.filter((s: Record<string, unknown>) => s.event_type === 'click').length;

    const byLink: Record<string, { title: string; count: number }> = {};
    for (const s of allStats.filter((s: Record<string, unknown>) => s.event_type === 'click' && s.link_id)) {
      const link = links.find(l => l.id === s.link_id);
      const title = link?.title || 'N/A';
      if (!byLink[s.link_id as string]) byLink[s.link_id as string] = { title, count: 0 };
      byLink[s.link_id as string].count++;
    }
    const clicksByLink = Object.entries(byLink).map(([link_id, v]) => ({ link_id, ...v })).sort((a, b) => b.count - a.count);

    const daily: Record<string, number> = {};
    for (const s of allStats.filter((s: Record<string, unknown>) => s.event_type === 'click')) {
      const d = (s.created_at as string).slice(0, 10);
      daily[d] = (daily[d] || 0) + 1;
    }
    const dailyClicks = Object.entries(daily).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

    setStats({
      totalVisits: visits,
      totalClicks: clicks,
      clicksByLink,
      dailyClicks,
      topLink: clicksByLink[0]?.title || '-',
    });
  }, [profile, links]);

  useEffect(() => { if (tab === 'stats') loadStats(); }, [tab, loadStats]);

  const saveSlug = async () => {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    if (!clean || !profile) return;
    const { error } = await supabase.from('bio_profiles').update({ slug: clean }).eq('id', profile.id);
    if (!error) { setSlug(clean); setProfile(prev => prev ? { ...prev, slug: clean } : prev); }
  };

  const publicUrl = `${window.location.origin}/bio/${profile?.slug || slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const items = [...links];
    const fromIdx = items.findIndex(l => l.id === dragId);
    const toIdx = items.findIndex(l => l.id === targetId);
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    setLinks(items);
    setDragId(null);
    for (let i = 0; i < items.length; i++) {
      await supabase.from('bio_links').update({ sort_order: i }).eq('id', items[i].id);
    }
  };

  const addLink = async (title: string, url: string, icon: string) => {
    const p = await ensureProfile();
    const { data } = await supabase.from('bio_links').insert({
      profile_id: p.id, title, url, icon, sort_order: links.length,
    }).select().single();
    if (data) setLinks(prev => [...prev, data]);
    setShowAddLink(false);
  };

  const updateLink = async (id: string, fields: Partial<BioLink>) => {
    await supabase.from('bio_links').update(fields).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l));
    setEditingLink(null);
  };

  const removeLink = async (id: string) => {
    await supabase.from('bio_links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const toggleLink = async (id: string, isActive: boolean) => {
    await supabase.from('bio_links').update({ is_active: isActive }).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: isActive } : l));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Perfil', icon: <User className="w-4 h-4" /> },
    { id: 'links', label: 'Enlaces', icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'appearance', label: 'Apariencia', icon: <Palette className="w-4 h-4" /> },
    { id: 'stats', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'qr', label: 'QR', icon: <QrCode className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mi Bio</h2>
          <p className="text-sm text-muted-foreground">Tu página de enlaces personalizada</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </Button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Ver</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center ${
                  tab === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t.icon}<span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug (tu enlace)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{window.location.origin}/bio/</span>
                    <Input value={slug} onChange={e => setSlug(e.target.value)} onBlur={saveSlug}
                      className="flex-1" placeholder="mi-negocio" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del negocio</label>
                  <Input value={profile?.name || ''} onChange={e => updateProfile({ name: e.target.value })}
                    placeholder="Spa Relax" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={profile?.description || ''} onChange={e => updateProfile({ description: e.target.value })}
                    rows={2} placeholder="Tu descripción corta..."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ciudad</label>
                  <Input value={profile?.city || ''} onChange={e => updateProfile({ city: e.target.value || null })}
                    placeholder="Buenos Aires" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">WhatsApp</label>
                    <Input value={profile?.whatsapp || ''} onChange={e => updateProfile({ whatsapp: e.target.value || null })}
                      placeholder="+54 9 11 1234-5678" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={profile?.email || ''} onChange={e => updateProfile({ email: e.target.value || null })}
                      placeholder="info@spa.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sitio web</label>
                  <Input value={profile?.website || ''} onChange={e => updateProfile({ website: e.target.value || null })}
                    placeholder="https://..." />
                </div>
                <div className="h-px bg-border/50" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Redes sociales</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Instagram</label>
                    <Input value={profile?.social_instagram || ''} onChange={e => updateProfile({ social_instagram: e.target.value || null })}
                      placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">TikTok</label>
                    <Input value={profile?.social_tiktok || ''} onChange={e => updateProfile({ social_tiktok: e.target.value || null })}
                      placeholder="https://tiktok.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Facebook</label>
                    <Input value={profile?.social_facebook || ''} onChange={e => updateProfile({ social_facebook: e.target.value || null })}
                      placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">YouTube</label>
                    <Input value={profile?.social_youtube || ''} onChange={e => updateProfile({ social_youtube: e.target.value || null })}
                      placeholder="https://youtube.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Twitter / X</label>
                    <Input value={profile?.social_twitter || ''} onChange={e => updateProfile({ social_twitter: e.target.value || null })}
                      placeholder="https://x.com/..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">LinkedIn</label>
                    <Input value={profile?.social_linkedin || ''} onChange={e => updateProfile({ social_linkedin: e.target.value || null })}
                      placeholder="https://linkedin.com/..." />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Links Tab */}
          {tab === 'links' && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Enlaces ({links.length})</p>
                  <Button size="sm" onClick={() => setShowAddLink(true)} className="gap-1"><Plus className="w-3.5 h-3.5" />Agregar</Button>
                </div>
                {links.length === 0 ? (
                  <div className="py-10 text-center">
                    <LinkIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Agregá tu primer enlace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {links.map(link => (
                      <div key={link.id}
                        draggable
                        onDragStart={() => handleDragStart(link.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(link.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          link.is_active ? 'border-border/50 bg-card' : 'border-border/30 bg-muted/30 opacity-60'
                        } ${dragId === link.id ? 'ring-2 ring-primary/30' : ''}`}>
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        <span className="text-lg shrink-0">{ICON_MAP[link.icon || 'link'] || '🔗'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => toggleLink(link.id, !link.is_active)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                            {link.is_active ? <Eye className="w-3.5 h-3.5 text-muted-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />}
                          </button>
                          <button onClick={() => setEditingLink(link)}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-xs text-muted-foreground font-medium">
                            Editar
                          </button>
                          <button onClick={() => removeLink(link.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {tab === 'appearance' && (
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color principal</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={profile?.primary_color || '#059669'}
                      onChange={e => updateProfile({ primary_color: e.target.value })}
                      className="h-10 w-10 rounded-lg border cursor-pointer" />
                    <Input value={profile?.primary_color || '#059669'}
                      onChange={e => updateProfile({ primary_color: e.target.value })}
                      className="w-32 font-mono text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fondo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['solid', 'gradient', 'image'] as const).map(type => (
                      <button key={type} onClick={() => updateProfile({ bg_type: type })}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          profile?.bg_type === type ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-border'
                        }`}>
                        {type === 'solid' ? 'Sólido' : type === 'gradient' ? 'Degradado' : 'Imagen'}
                      </button>
                    ))}
                  </div>
                </div>
                {profile?.bg_type === 'solid' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Color de fondo</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={profile.bg_solid_color}
                        onChange={e => updateProfile({ bg_solid_color: e.target.value })}
                        className="h-10 w-10 rounded-lg border cursor-pointer" />
                      <Input value={profile.bg_solid_color}
                        onChange={e => updateProfile({ bg_solid_color: e.target.value })}
                        className="w-32 font-mono text-sm" />
                    </div>
                  </div>
                )}
                {profile?.bg_type === 'gradient' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Degradado</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BIO_BG_PRESETS.map(preset => (
                        <button key={preset.label} onClick={() => updateProfile({ bg_gradient_from: preset.from, bg_gradient_to: preset.to })}
                          className={`h-12 rounded-xl border-2 transition-all ${
                            profile.bg_gradient_from === preset.from ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'
                          }`}
                          style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }} />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <div className="space-y-1 flex-1">
                        <label className="text-xs text-muted-foreground">Desde</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={profile.bg_gradient_from}
                            onChange={e => updateProfile({ bg_gradient_from: e.target.value })}
                            className="h-8 w-8 rounded border cursor-pointer" />
                          <Input value={profile.bg_gradient_from} onChange={e => updateProfile({ bg_gradient_from: e.target.value })}
                            className="text-xs font-mono" />
                        </div>
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-xs text-muted-foreground">Hasta</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={profile.bg_gradient_to}
                            onChange={e => updateProfile({ bg_gradient_to: e.target.value })}
                            className="h-8 w-8 rounded border cursor-pointer" />
                          <Input value={profile.bg_gradient_to} onChange={e => updateProfile({ bg_gradient_to: e.target.value })}
                            className="text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estilo de botones</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BIO_BUTTON_STYLES.map(s => (
                      <button key={s.value} onClick={() => updateProfile({ button_style: s.value })}
                        className={`p-3 border text-sm font-medium transition-all ${
                          profile?.button_style === s.value ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border/50 hover:border-border'
                        }`}
                        style={{ borderRadius: s.value === 'pill' ? '9999px' : s.value === 'square' ? '8px' : '12px' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sombra en botones</p>
                    <p className="text-xs text-muted-foreground">Efecto de elevación sutil</p>
                  </div>
                  <button onClick={() => updateProfile({ button_shadow: !profile?.button_shadow })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${profile?.button_shadow ? 'bg-primary' : 'bg-muted'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile?.button_shadow ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Tab */}
          {tab === 'stats' && (
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">Visitas (30 días)</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalVisits.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">Clicks totales</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalClicks.toLocaleString()}</p>
                      </div>
                    </div>
                    {stats.clicksByLink.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Clicks por enlace</p>
                        <div className="space-y-2">
                          {stats.clicksByLink.map((item) => {
                            const pct = stats.totalClicks > 0 ? (item.count / stats.totalClicks) * 100 : 0;
                            return (
                              <div key={item.link_id} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{item.title}</span>
                                  <span className="text-muted-foreground">{item.count}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: profile?.primary_color || '#059669' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {stats.dailyClicks.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Clicks diarios</p>
                        <div className="flex items-end gap-1 h-20">
                          {stats.dailyClicks.map(d => {
                            const max = Math.max(...stats.dailyClicks.map(x => x.count), 1);
                            return (
                              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t transition-all" style={{
                                  height: `${(d.count / max) * 100}%`,
                                  minHeight: '4px',
                                  background: profile?.primary_color || '#059669',
                                  opacity: 0.7,
                                }} />
                                <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* QR Tab */}
          {tab === 'qr' && (
            <Card className="border-border/50">
              <CardContent className="p-6 flex flex-col items-center space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <QrCodeFromUrl url={publicUrl} color={profile?.primary_color || '#059669'} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Código QR de tu bio</p>
                  <p className="text-xs text-muted-foreground">Escanealo para abrir tu página</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadQR(publicUrl, profile?.primary_color || '#059669')} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Descargar PNG
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vista previa</p>
            <div className="mx-auto max-w-[280px]">
              <div className="rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden shadow-2xl">
                <div className="rounded-[2rem] overflow-hidden" style={{
                  background: profile?.bg_type === 'gradient'
                    ? `linear-gradient(135deg, ${profile.bg_gradient_from}, ${profile.bg_gradient_to})`
                    : profile?.bg_type === 'image' && profile.bg_image_url
                    ? `url(${profile.bg_image_url}) center/cover`
                    : profile?.bg_solid_color || '#ffffff',
                  minHeight: '500px',
                }}>
                  <div className="p-6 flex flex-col items-center text-center space-y-5 pt-10">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                        style={{ background: profile?.primary_color || '#059669' }}>
                        {(profile?.name || 'N')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{profile?.name || 'Tu negocio'}</h3>
                      {profile?.description && <p className="text-xs mt-1 opacity-70">{profile.description}</p>}
                      {profile?.city && <p className="text-xs mt-1 opacity-50">📍 {profile.city}</p>}
                    </div>
                    <div className="w-full space-y-2.5">
                      {links.filter(l => l.is_active).map(link => (
                        <div key={link.id}
                          className={`w-full px-4 py-3 text-sm font-medium text-center transition-all hover:scale-[1.02] ${
                            getButtonRadius(profile?.button_style || 'rounded')
                          } ${profile?.button_shadow ? 'shadow-md hover:shadow-lg' : ''}`}
                          style={{
                            background: link.color || profile?.primary_color || '#059669',
                            color: '#ffffff',
                          }}>
                          <span className="mr-1.5">{ICON_MAP[link.icon || 'link'] || '🔗'}</span>
                          {link.title}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      {profile?.social_instagram && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">📸</span>}
                      {profile?.social_tiktok && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">🎵</span>}
                      {profile?.social_facebook && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">👤</span>}
                      {profile?.social_youtube && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">▶️</span>}
                      {profile?.social_twitter && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">🐦</span>}
                      {profile?.social_linkedin && <span className="text-lg opacity-60 hover:opacity-100 transition-opacity">💼</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Link Dialog */}
      <AddLinkDialog open={showAddLink} onClose={() => setShowAddLink(false)} onAdd={addLink} />
      {editingLink && (
        <EditLinkDialog link={editingLink} onClose={() => setEditingLink(null)} onSave={(fields) => updateLink(editingLink.id, fields)} />
      )}
    </div>
  );
}

function AddLinkDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (title: string, url: string, icon: string) => void }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('link');
  const handleSave = () => { if (title.trim() && url.trim()) { onAdd(title.trim(), url.trim(), icon); setTitle(''); setUrl(''); setIcon('link'); } };
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Nuevo enlace</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reservar turno" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Icono</label>
            <select value={icon} onChange={e => setIcon(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="link">🔗 Enlace</option>
              <option value="calendar">📅 Reservar</option>
              <option value="shopping-bag">🛍️ Tienda</option>
              <option value="message-circle">💬 WhatsApp</option>
              <option value="instagram">📸 Instagram</option>
              <option value="facebook">👤 Facebook</option>
              <option value="twitter">🐦 Twitter</option>
              <option value="youtube">▶️ YouTube</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="map-pin">📍 Ubicación</option>
              <option value="phone">📞 Llamar</option>
              <option value="mail">✉️ Email</option>
              <option value="globe">🌐 Sitio web</option>
              <option value="file-text">📄 Blog</option>
              <option value="linkedin">💼 LinkedIn</option>
              <option value="star">⭐ Destacado</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!title.trim() || !url.trim()}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditLinkDialog({ link, onClose, onSave }: { link: BioLink; onClose: () => void; onSave: (fields: Partial<BioLink>) => void }) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [icon, setIcon] = useState(link.icon || 'link');
  const [color, setColor] = useState(link.color || '');
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Editar enlace</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Icono</label>
            <select value={icon} onChange={e => setIcon(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="link">🔗 Enlace</option>
              <option value="calendar">📅 Reservar</option>
              <option value="shopping-bag">🛍️ Tienda</option>
              <option value="message-circle">💬 WhatsApp</option>
              <option value="instagram">📸 Instagram</option>
              <option value="facebook">👤 Facebook</option>
              <option value="twitter">🐦 Twitter</option>
              <option value="youtube">▶️ YouTube</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="map-pin">📍 Ubicación</option>
              <option value="phone">📞 Llamar</option>
              <option value="mail">✉️ Email</option>
              <option value="globe">🌐 Sitio web</option>
              <option value="file-text">📄 Blog</option>
              <option value="linkedin">💼 LinkedIn</option>
              <option value="star">⭐ Destacado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color del botón (opcional)</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color || '#059669'} onChange={e => setColor(e.target.value)}
                className="h-10 w-10 rounded-lg border cursor-pointer" />
              <Button variant="outline" size="sm" onClick={() => setColor('')}>Usar color principal</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave({ title: title.trim(), url: url.trim(), icon, color: color || null })}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrCodeFromUrl({ color }: { url: string; color: string }) {
  const size = 200;
  const modules = 25;
  const cellSize = size / modules;
  const grid: boolean[][] = [];
  for (let r = 0; r < modules; r++) {
    grid[r] = [];
    for (let c = 0; c < modules; c++) {
      const isFinder = (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);
      const isBorder = isFinder && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= modules - 7 && r === modules - 1) || (c >= modules - 7 && c === modules - 1));
      const isInner = isFinder && r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const isInner2 = isFinder && r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4;
      const isInner3 = isFinder && r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3;
      if (isBorder || isInner || isInner2 || isInner3) {
        grid[r][c] = true;
      } else {
        grid[r][c] = Math.random() > 0.55;
      }
    }
  }
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (grid[r][c]) {
        cells.push(<rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} rx={1} fill={color} />);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {cells}
    </svg>
  );
}

function downloadQR(_url: string, color: string): void {
  const size = 512;
  const modules = 25;
  const cellSize = size / modules;
  const grid: boolean[][] = [];
  for (let r = 0; r < modules; r++) {
    grid[r] = [];
    for (let c = 0; c < modules; c++) {
      const isFinder = (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);
      const isBorder = isFinder && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= modules - 7 && r === modules - 1) || (c >= modules - 7 && c === modules - 1));
      const isInner = isFinder && r >= 2 && r <= 4 && c >= 2 && c <= 4;
      const isInner2 = isFinder && r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4;
      const isInner3 = isFinder && r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3;
      grid[r][c] = isBorder || isInner || isInner2 || isInner3 || Math.random() > 0.55;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = color;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (grid[r][c]) {
        ctx.beginPath();
        ctx.roundRect(c * cellSize, r * cellSize, cellSize, cellSize, 2);
        ctx.fill();
      }
    }
  }
  const link = document.createElement('a');
  link.download = 'qr-bio.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
