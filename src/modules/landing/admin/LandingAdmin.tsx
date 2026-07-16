import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Eye, EyeOff, Save, Loader2, Plus, Trash2, Globe,
  Settings, Palette, Image as ImageIcon, Eye as EyeIcon, Send, Menu,
  Sparkles, Info, Star, Wrench, Heart, MessageSquare,
  HelpCircle, MousePointerClick, Phone,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { supabase, type Business } from '../../../lib/supabase';
import {
  TEMPLATES, AVAILABLE_FONTS, DEFAULT_SECTIONS, DEFAULT_THEME,
} from '../config';
import {
  SECTION_DEFINITIONS, type LandingSections, type LandingPage,
  type LandingTheme, type LandingTemplate,
} from '../types';
import { LandingPage as LandingPageComponent } from '../pages/LandingPage';

const SECTION_ICONS: Record<string, typeof Sparkles> = {
  Menu, Sparkles, Info, Star, Wrench, Heart, ImageIcon,
  MessageSquare, HelpCircle, MousePointerClick, Phone,
};

const LUCIDE_ICON_NAMES = [
  'Star', 'Wrench', 'Palette', 'Zap', 'Shield', 'Clock', 'Heart',
  'Award', 'CheckCircle', 'Globe', 'Phone', 'Mail', 'MapPin',
  'Users', 'TrendingUp', 'Target', 'Smile', 'Coffee', 'BookOpen',
  'Camera', 'Music', 'Scissors', 'Dumbbell', 'Leaf', 'Sun',
  'Moon', 'Droplets', 'Flame', 'Sparkles', 'Crown', 'Gem',
  'Diamond', 'Triangle', 'Circle', 'Square', 'Hexagon', 'Pentagon',
];

interface Props {
  business: Business | null;
}

type AdminTab = 'general' | 'hero' | 'about' | 'main_service' | 'services' | 'why' | 'gallery' | 'testimonials' | 'faq' | 'cta' | 'footer' | 'design' | 'preview';

const ADMIN_TABS: { id: AdminTab; label: string; icon: typeof Sparkles }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'hero', label: 'Hero', icon: Sparkles },
  { id: 'about', label: 'Nosotros', icon: Info },
  { id: 'main_service', label: 'Servicio Principal', icon: Star },
  { id: 'services', label: 'Servicios', icon: Wrench },
  { id: 'why', label: 'Por Qué Elegirnos', icon: Heart },
  { id: 'gallery', label: 'Galería', icon: ImageIcon },
  { id: 'testimonials', label: 'Testimonios', icon: MessageSquare },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'cta', label: 'CTA', icon: MousePointerClick },
  { id: 'footer', label: 'Footer', icon: Phone },
  { id: 'design', label: 'Diseño', icon: Palette },
  { id: 'preview', label: 'Vista Previa', icon: EyeIcon },
];

function compressImage(file: File, maxW = 1920, maxH = 1080): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      if (h > maxH) { w = w * maxH / h; h = maxH; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compresión fallida')), 'image/webp', 0.85);
    };
    img.onerror = () => reject(new Error('Error al leer imagen'));
    img.src = url;
  });
}

export function LandingAdmin({ business }: Props) {
  const [landing, setLanding] = useState<LandingPage | null>(null);
  const [sections, setSections] = useState<LandingSections>(DEFAULT_SECTIONS);
  const [theme, setTheme] = useState<LandingTheme>(DEFAULT_THEME);
  const [template, setTemplate] = useState<LandingTemplate>('minimal');
  const [visibleSections, setVisibleSections] = useState<string[]>(
    SECTION_DEFINITIONS.map(s => s.key)
  );
  const [logoUrl, setLogoUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('general');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string>('');
  const [uploadTarget, setUploadTarget] = useState<string>('');

  const loadLanding = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setLanding(data as unknown as LandingPage);
        setSections(data.sections as unknown as LandingSections);
        setTheme(data.theme as unknown as LandingTheme);
        setTemplate((data.template as LandingTemplate) || 'minimal');
        setSlug(data.slug || '');
        setLogoUrl(data.logo_url || '');
        if (data.visible_sections) setVisibleSections(data.visible_sections as string[]);
      } else {
        setSlug(business.slug || 'mi-landing');
      }
    } finally {
      setLoading(false);
    }
  }, [business?.id, business?.slug]);

  useEffect(() => { loadLanding(); }, [loadLanding]);

  const updateSection = (key: string, value: unknown) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  const updateTheme = (key: string, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const toggleVisibleSection = (key: string) => {
    setVisibleSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business?.id) return;
    const target = uploadTargetRef.current || uploadTarget;
    if (!target) return;
    setUploadingImage(target);
    setUploadError(null);
    try {
      const blob = await compressImage(file);
      const ext = 'webp';
      const fileName = `${business.id}/landing-${target}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('branding').upload(fileName, blob, {
        upsert: false, contentType: 'image/webp',
      });
      if (error) throw new Error(error.message || 'Error al subir imagen al servidor');
      const { data: urlData } = supabase.storage.from('branding').getPublicUrl(fileName);
      const publicUrl = (urlData?.publicUrl || '') + `?t=${Date.now()}`;

      if (target === 'logo') {
        setLogoUrl(publicUrl);
      } else if (target === 'hero_image') {
        updateSection('hero', { ...sections.hero, image_url: publicUrl });
      } else if (target === 'hero_presentation') {
        updateSection('hero', { ...sections.hero, presentation_image_url: publicUrl });
      } else if (target === 'about_image') {
        updateSection('about', { ...sections.about, image_url: publicUrl });
      } else if (target.startsWith('gallery_')) {
        const idx = parseInt(target.split('_')[1]);
        const newImages = [...sections.gallery.images];
        newImages[idx] = publicUrl;
        updateSection('gallery', { ...sections.gallery, images: newImages });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir imagen';
      console.error('Upload error:', err);
      setUploadError(msg);
    } finally {
      setUploadingImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (target: string) => {
    setUploadTarget(target);
    uploadTargetRef.current = target;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleSave = async (): Promise<string | null> => {
    if (!business?.id) return null;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (landing?.id) {
        const { error } = await supabase
          .from('landing_pages')
          .update({
            sections, theme, template, visible_sections: visibleSections,
            logo_url: logoUrl || null, slug, updated_at: new Date().toISOString(),
          })
          .eq('id', landing.id);
        if (error) throw error;
        await loadLanding();
        return landing.id;
      } else {
        const { data, error } = await supabase
          .from('landing_pages')
          .insert({
            business_id: business.id,
            slug: slug || business.slug,
            sections, theme, template, visible_sections: visibleSections,
            logo_url: logoUrl || null, status: 'draft',
          })
          .select('id')
          .single();
        if (error) throw error;
        await loadLanding();
        return data?.id || null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setSaveMessage({ type: 'error', text: msg });
      console.error('Save error:', err);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!business?.id) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const savedId = await handleSave();
      const targetId = savedId || landing?.id;
      if (!targetId) {
        setSaveMessage({ type: 'error', text: 'No se pudo guardar la landing. Intentá de nuevo.' });
        return;
      }
      const { error } = await supabase
        .from('landing_pages')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', targetId);
      if (error) throw error;
      await loadLanding();
      setSaveMessage({ type: 'success', text: 'Landing publicada correctamente' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al publicar';
      setSaveMessage({ type: 'error', text: msg });
      console.error('Publish error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <span className="shrink-0">Error:</span>
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      {saveMessage && (
        <div className={`rounded-lg border p-3 text-sm flex items-center gap-2 ${
          saveMessage.type === 'success'
            ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        }`}>
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage(null)} className="ml-auto shrink-0 hover:opacity-70">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Landing Page
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creá una landing page profesional para tu negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMobilePreview(!showMobilePreview)}>
            {showMobilePreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showMobilePreview ? 'Editor' : 'Preview'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Card className="sticky top-4">
            <CardContent className="p-2">
              {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9">
          {activeTab === 'preview' ? (
            <PreviewPanel sections={sections} theme={theme} template={template} slug={slug} logoUrl={logoUrl} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-display">
                  {ADMIN_TABS.find(t => t.id === activeTab)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {activeTab === 'general' && (
                  <GeneralTab
                    slug={slug} setSlug={setSlug}
                    template={template} setTemplate={setTemplate}
                    visibleSections={visibleSections} toggleVisibleSection={toggleVisibleSection}
                    logoUrl={logoUrl} triggerUpload={triggerUpload}
                    uploadingImage={uploadingImage}
                  />
                )}
                {activeTab === 'hero' && (
                  <HeroTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
                )}
                {activeTab === 'about' && (
                  <AboutTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
                )}
                {activeTab === 'main_service' && (
                  <MainServiceTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'services' && (
                  <ServicesTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'why' && (
                  <WhyChooseUsTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'gallery' && (
                  <GalleryTab sections={sections} updateSection={updateSection} triggerUpload={triggerUpload} uploadingImage={uploadingImage} />
                )}
                {activeTab === 'testimonials' && (
                  <TestimonialsTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'faq' && (
                  <FaqTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'cta' && (
                  <CtaTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'footer' && (
                  <FooterTab sections={sections} updateSection={updateSection} />
                )}
                {activeTab === 'design' && (
                  <DesignTab theme={theme} updateTheme={updateTheme} />
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              {landing?.status === 'published' ? (
                <span className="text-emerald-600 font-medium">● Publicada</span>
              ) : (
                <span className="text-amber-600 font-medium">● Borrador</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
              <Button onClick={handlePublish} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                <Send className="h-4 w-4 mr-1" /> Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ slug, setSlug, template, setTemplate, visibleSections, toggleVisibleSection, logoUrl, triggerUpload, uploadingImage }: {
  slug: string; setSlug: (v: string) => void;
  template: LandingTemplate; setTemplate: (v: LandingTemplate) => void;
  visibleSections: string[]; toggleVisibleSection: (k: string) => void;
  logoUrl: string; triggerUpload: (t: string) => void; uploadingImage: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Slug de la landing</label>
        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="mi-landing" className="mt-1" />
        <p className="text-xs text-muted-foreground mt-1">URL: /landing/{slug || '...'}</p>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-cover border" />}
          <Button variant="outline" size="sm" onClick={() => triggerUpload('logo')} disabled={!!uploadingImage}>
            {uploadingImage === 'logo' ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">Plantilla</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                template === t.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="font-semibold text-sm">{t.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">Secciones visibles</label>
        <div className="space-y-2">
          {SECTION_DEFINITIONS.map(s => {
            const Icon = SECTION_ICONS[s.icon] || Sparkles;
            return (
              <label key={s.key} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={visibleSections.includes(s.key)}
                  onChange={() => toggleVisibleSection(s.key)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroTab({ sections, updateSection, triggerUpload, uploadingImage }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}) {
  const h = sections.hero;
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título principal</label>
        <Input value={h.title} onChange={e => updateSection('hero', { ...h, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
        <Input value={h.subtitle} onChange={e => updateSection('hero', { ...h, subtitle: e.target.value })} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Botón principal</label>
          <Input value={h.cta_text} onChange={e => updateSection('hero', { ...h, cta_text: e.target.value })} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Botón secundario</label>
          <Input value={h.cta_secondary_text} onChange={e => updateSection('hero', { ...h, cta_secondary_text: e.target.value })} className="mt-1" />
        </div>
      </div>
      <Separator />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Imagen de fondo</label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('hero_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'hero_image' ? 'Subiendo...' : h.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {h.image_url && (
            <>
              <img src={h.image_url} alt="" className="h-16 w-32 rounded-lg object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('hero', { ...h, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Imagen de presentación (opcional)</label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('hero_presentation')} disabled={!!uploadingImage}>
            {uploadingImage === 'hero_presentation' ? 'Subiendo...' : h.presentation_image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {h.presentation_image_url && (
            <>
              <img src={h.presentation_image_url} alt="" className="h-16 w-16 rounded-lg object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('hero', { ...h, presentation_image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Opacidad del overlay — {h.overlay_opacity}%</label>
        <input type="range" min="0" max="100" value={h.overlay_opacity}
          onChange={e => updateSection('hero', { ...h, overlay_opacity: Number(e.target.value) })}
          className="w-full mt-1" />
      </div>
    </div>
  );
}

function AboutTab({ sections, updateSection, triggerUpload, uploadingImage }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}) {
  const a = sections.about;
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título</label>
        <Input value={a.title} onChange={e => updateSection('about', { ...a, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
        <textarea value={a.description} onChange={e => updateSection('about', { ...a, description: e.target.value })} rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Imagen</label>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('about_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'about_image' ? 'Subiendo...' : a.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {a.image_url && (
            <>
              <img src={a.image_url} alt="" className="h-16 w-32 rounded-lg object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('about', { ...a, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MainServiceTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const ms = sections.main_service;
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Ícono</label>
        <IconSelector value={ms.icon} onChange={v => updateSection('main_service', { ...ms, icon: v })} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título</label>
        <Input value={ms.title} onChange={e => updateSection('main_service', { ...ms, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
        <textarea value={ms.description} onChange={e => updateSection('main_service', { ...ms, description: e.target.value })} rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>
    </div>
  );
}

function ServicesTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const ss = sections.secondary_services;
  const addItem = () => {
    updateSection('secondary_services', {
      ...ss,
      items: [...ss.items, { icon: 'Wrench', title: '', description: '' }],
    });
  };
  const removeItem = (i: number) => {
    updateSection('secondary_services', {
      ...ss,
      items: ss.items.filter((_, idx) => idx !== i),
    });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...ss.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('secondary_services', { ...ss, items });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
        <Input value={ss.title} onChange={e => updateSection('secondary_services', { ...ss, title: e.target.value })} className="mt-1" />
      </div>
      <Separator />
      {ss.items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Servicio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <IconSelector value={item.icon} onChange={v => updateItem(i, 'icon', v)} />
          <Input value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Título" />
          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Descripción" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar servicio
      </Button>
    </div>
  );
}

function WhyChooseUsTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const w = sections.why_choose_us;
  const addItem = () => {
    updateSection('why_choose_us', { ...w, items: [...w.items, { icon: 'CheckCircle', text: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('why_choose_us', { ...w, items: w.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...w.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('why_choose_us', { ...w, items });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
        <Input value={w.title} onChange={e => updateSection('why_choose_us', { ...w, title: e.target.value })} className="mt-1" />
      </div>
      <Separator />
      {w.items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Beneficio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <IconSelector value={item.icon} onChange={v => updateItem(i, 'icon', v)} />
          <Input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Texto del beneficio" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar beneficio
      </Button>
    </div>
  );
}

function GalleryTab({ sections, updateSection, triggerUpload, uploadingImage }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}) {
  const g = sections.gallery;
  const maxImages = 6;
  const removeImage = (i: number) => {
    const newImages = g.images.filter((_, idx) => idx !== i);
    updateSection('gallery', { ...g, images: newImages });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
        <Input value={g.title} onChange={e => updateSection('gallery', { ...g, title: e.target.value })} className="mt-1" />
      </div>
      <Separator />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">
          Imágenes ({g.images.length}/{maxImages})
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {g.images.map((img, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {g.images.length < maxImages && (
            <button
              onClick={() => triggerUpload(`gallery_${g.images.length}`)}
              disabled={!!uploadingImage}
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {uploadingImage?.startsWith('gallery_') ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Plus className="h-6 w-6 mb-1" />
                  <span className="text-xs">Agregar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TestimonialsTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const t = sections.testimonials;
  const addItem = () => {
    updateSection('testimonials', { ...t, items: [...t.items, { name: '', text: '', rating: 5 }] });
  };
  const removeItem = (i: number) => {
    updateSection('testimonials', { ...t, items: t.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: unknown) => {
    const items = [...t.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('testimonials', { ...t, items });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
        <Input value={t.title} onChange={e => updateSection('testimonials', { ...t, title: e.target.value })} className="mt-1" />
      </div>
      <Separator />
      {t.items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Testimonio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Nombre del cliente" />
          <textarea value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Testimonio" rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Calificación</label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => updateItem(i, 'rating', star)}
                  className={`text-lg ${star <= item.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar testimonio
      </Button>
    </div>
  );
}

function FaqTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const f = sections.faq;
  const addItem = () => {
    updateSection('faq', { ...f, items: [...f.items, { question: '', answer: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('faq', { ...f, items: f.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('faq', { ...f, items });
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título de sección</label>
        <Input value={f.title} onChange={e => updateSection('faq', { ...f, title: e.target.value })} className="mt-1" />
      </div>
      <Separator />
      {f.items.map((item, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">FAQ {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.question} onChange={e => updateItem(i, 'question', e.target.value)} placeholder="Pregunta" />
          <textarea value={item.answer} onChange={e => updateItem(i, 'answer', e.target.value)} placeholder="Respuesta" rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar FAQ
      </Button>
    </div>
  );
}

function CtaTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const c = sections.cta;
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Título</label>
        <Input value={c.title} onChange={e => updateSection('cta', { ...c, title: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
        <Input value={c.description} onChange={e => updateSection('cta', { ...c, description: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Texto del botón</label>
        <Input value={c.button_text} onChange={e => updateSection('cta', { ...c, button_text: e.target.value })} className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Acción del botón</label>
        <select value={c.button_action} onChange={e => updateSection('cta', { ...c, button_action: e.target.value })}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="booking">Reservar Turno</option>
          <option value="info">Solicitar Información</option>
        </select>
      </div>
    </div>
  );
}

function FooterTab({ sections, updateSection }: {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}) {
  const f = sections.footer;
  const update = (field: string, value: string) => updateSection('footer', { ...f, [field]: value });
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Dirección</label>
        <Input value={f.address} onChange={e => update('address', e.target.value)} className="mt-1" placeholder="Av. Ejemplo 1234" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
          <Input value={f.phone} onChange={e => update('phone', e.target.value)} className="mt-1" placeholder="+54 11 1234-5678" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input value={f.email} onChange={e => update('email', e.target.value)} className="mt-1" placeholder="info@tu negocio.com" />
        </div>
      </div>
      <Separator />
      <p className="text-xs font-medium text-muted-foreground">Redes sociales</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">Instagram</label>
          <Input value={f.instagram} onChange={e => update('instagram', e.target.value)} className="mt-1" placeholder="@tunegocio" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Facebook</label>
          <Input value={f.facebook} onChange={e => update('facebook', e.target.value)} className="mt-1" placeholder="URL de Facebook" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">TikTok</label>
          <Input value={f.tiktok} onChange={e => update('tiktok', e.target.value)} className="mt-1" placeholder="@tunegocio" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Copyright</label>
        <Input value={f.copyright} onChange={e => update('copyright', e.target.value)} className="mt-1" placeholder="© 2026 Tu Negocio. Todos los derechos reservados." />
      </div>
    </div>
  );
}

function DesignTab({ theme, updateTheme }: {
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">Colores</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Principal', key: 'primary_color' },
            { label: 'Secundario', key: 'secondary_color' },
            { label: 'Fondo', key: 'bg_color' },
            { label: 'Texto', key: 'text_color' },
            { label: 'Botones', key: 'button_color' },
            { label: 'Fondo Footer', key: 'footer_bg_color' },
            { label: 'Texto Footer', key: 'footer_text_color' },
          ].map(c => (
            <div key={c.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{c.label}</label>
              <div className="flex items-center gap-2.5">
                <input type="color" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-lg border bg-transparent p-0.5 shrink-0" />
                <Input type="text" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-9 font-mono text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-3 block">Tipografía</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Títulos</label>
            <select value={theme.font_heading} onChange={e => updateTheme('font_heading', e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cuerpo</label>
            <select value={theme.font_body} onChange={e => updateTheme('font_body', e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
      {LUCIDE_ICON_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  );
}

function PreviewPanel({ sections, theme, template, slug, logoUrl }: {
  sections: LandingSections; theme: LandingTheme; template: LandingTemplate;
  slug: string; logoUrl: string;
}) {
  const previewData: LandingPage = {
    id: 'preview',
    business_id: 'preview',
    slug,
    template,
    sections: sections as unknown as Record<string, unknown>,
    theme: theme as unknown as Record<string, unknown>,
    status: 'published',
    visible_sections: SECTION_DEFINITIONS.map(s => s.key),
    logo_url: logoUrl || null,
    seo: { title: '', description: '', og_image: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-xl">
        <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Vista previa en vivo</span>
          <Button variant="outline" size="sm" asChild>
            <a href={`/landing/${slug}`} target="_blank" className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> Abrir en nueva pestaña
            </a>
          </Button>
        </div>
        <div className="h-[600px] overflow-auto border-t">
          <LandingPageComponent initialData={previewData} isPreview />
        </div>
      </CardContent>
    </Card>
  );
}
