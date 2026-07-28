import { useState, useEffect } from 'react';
import { XCircle, RotateCcw } from 'lucide-react';
import { Branding } from '../../lib/supabase';
import { compressImage as compressImageUtil } from '../../lib/image-utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { useTheme } from '../../contexts/ThemeContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { allThemes } from '../../themes';
import { authInvoke } from './helpers';
import { useImageUpload } from '../../hooks/useImageUpload';
import { PhonePreview } from '../../components/admin/PhonePreview';

export function AppearanceManager({
  branding, onRefresh, showSuccess
}: {
  branding: Branding | null;
  onRefresh: () => void;
  showSuccess: (msg: string) => void;
}) {
  const { business } = useBusiness();
  const [logoUrl, setLogoUrl] = useState(branding?.logo_url || '');
  const [title, setTitle] = useState(branding?.title || 'Reserva tu Turno');
  const [subtitle, setSubtitle] = useState(branding?.subtitle || 'Sistema de Reserva');
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || '#059669');
  const [bgColor, setBgColor] = useState(branding?.background_color || '#111827');
  const [cardBgColor, setCardBgColor] = useState(branding?.card_bg_color || '#1f2937');
  const [textColor, setTextColor] = useState(branding?.text_color || '#ffffff');
  const [mutedColor, setMutedColor] = useState(branding?.muted_color || '#e6e6e6');
  const [captionColor, setCaptionColor] = useState(branding?.caption_color || '#e6e6e6');
  const [bgImageUrl, setBgImageUrl] = useState(branding?.background_image_url || '');
  const [bgOpacity, setBgOpacity] = useState(branding?.bg_opacity ?? 80);
  const [overlayColor, setOverlayColor] = useState(branding?.overlay_color || branding?.background_color || '#111827');
  const [headerOpacity, setHeaderOpacity] = useState(branding?.header_opacity ?? 26);
  const [saving, setSaving] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const logo = useImageUpload({
    bucket: 'branding',
    pathPrefix: business?.id || 'default',
    filePrefix: 'logo',
    compress: (f) => compressImage(f, 'logo'),
  });
  const bg = useImageUpload({
    bucket: 'branding',
    pathPrefix: business?.id || 'default',
    filePrefix: 'bg',
    compress: (f) => compressImage(f, 'bg'),
  });
  const uploading = logo.uploading || bg.uploading;
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!branding) return;
    setHeaderOpacity(branding.header_opacity ?? 26);
  }, [branding]);

  const applyTheme = (themeId: string) => {
    const t = allThemes.find(t => t.id === themeId);
    if (!t) return;
    setSelectedThemeId(themeId);
    setTheme(t);
    setPrimaryColor(t.tokens.primary);
    setBgColor(t.tokens.background);
    setCardBgColor(t.tokens.cardBg);
    setTextColor(t.tokens.text);
    setMutedColor(t.tokens.textMuted);
    setCaptionColor(t.tokens.caption);
  };

  const compressImage = (file: File, type: 'logo' | 'bg'): Promise<Blob> => {
    const opts = type === 'logo'
      ? { maxWidth: 400, maxHeight: 400, quality: 0.8 }
      : { maxWidth: 1920, maxHeight: 1080, quality: 0.85 };
    const maxSize = type === 'logo' ? 500 * 1024 : 2 * 1024 * 1024;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (file.size <= maxSize && img.width <= opts.maxWidth && img.height <= opts.maxHeight && file.type !== 'image/gif') {
          resolve(file);
          return;
        }
        compressImageUtil(file, opts).then(resolve, reject);
      };
      img.onerror = () => reject(new Error('Error al leer imagen'));
      img.src = url;
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    logo.handleFileChange(e, (url) => setLogoUrl(url), (msg) => showSuccess(msg));
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    bg.handleFileChange(e, (url) => setBgImageUrl(url), (msg) => showSuccess(msg));
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      const data = {
                logo_url: logoUrl,
        title,
        subtitle,
        primary_color: primaryColor,
        background_color: bgColor,
        card_bg_color: cardBgColor,
        text_color: textColor,
        muted_color: mutedColor,
        caption_color: captionColor,
        background_image_url: bgImageUrl,
        bg_opacity: bgOpacity,
        overlay_color: overlayColor,
        header_color: primaryColor,
        header_opacity: headerOpacity,
      };

      const { data: res, error } = await authInvoke('admin-update-branding', data);

      if (error || !res?.success) {
        showSuccess(res?.error || 'Error al guardar');
        return;
      }

      onRefresh();
      showSuccess('Apariencia guardada correctamente');
    } catch {
      showSuccess('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Controls ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-8">
          {/* Temas */}
          <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {allThemes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTheme(t.id)}
                    className={`relative flex items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-premium ${
                      selectedThemeId === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                    style={{ backgroundColor: '#10b77f' }}
                  >
                    <div className="flex gap-1.5">
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: t.tokens.primary }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: t.tokens.background }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: t.tokens.cardBg }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: t.tokens.text }} />
                      <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: t.tokens.textMuted }} />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logo + Textos */}
          <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
            <CardHeader>
              <CardTitle className="font-display">Logo y textos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full overflow-hidden border shrink-0" style={{ backgroundColor: primaryColor }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => logo.fileInputRef.current?.click()} disabled={uploading} variant="outline" size="sm">
                      {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar' : 'Subir logo'}
                    </Button>
                    {logoUrl && (
                      <Button onClick={() => setLogoUrl('')} variant="ghost" size="sm" className="text-destructive">
                        Eliminar
                      </Button>
                    )}
                  </div>
                  <input ref={logo.fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>
              <Separator />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Título principal</label>
                  <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl" placeholder="Reserva tu Turno" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Subtítulo</label>
                  <Input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-12 rounded-xl" placeholder="Sistema de Reserva" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colores */}
          <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
            <CardHeader>
              <CardTitle className="font-display">Colores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'Principal (botones, acentos)', value: primaryColor, set: setPrimaryColor },
                { label: 'Fondo de página', value: bgColor, set: setBgColor },
                { label: 'Encabezado y pie', value: cardBgColor, set: setCardBgColor },
                { label: 'Títulos', value: textColor, set: setTextColor },
                { label: 'Subtítulos', value: mutedColor, set: setMutedColor },
                { label: 'Pasos e informativos', value: captionColor, set: setCaptionColor },
              ].map(c => (
                <div key={c.label} className="space-y-2">
                  <label className="text-xs font-medium text-foreground">{c.label}</label>
                  <div className="flex items-center gap-2.5">
                    <input type="color" value={c.value}
                      onChange={(e) => { c.set(e.target.value); setSelectedThemeId(''); }}
                      className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
                    <Input type="text" value={c.value}
                      onChange={(e) => { c.set(e.target.value); setSelectedThemeId(''); }}
                      className="h-12 rounded-xl font-mono text-xs" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Fondo */}
          <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
            <CardHeader>
              <CardTitle className="font-display">Imagen de fondo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {bgImageUrl && (
                <div className="relative h-24 w-full overflow-hidden rounded-xl">
                  <img src={bgImageUrl} alt="Fondo" className="h-full w-full object-cover" />
                  <button onClick={() => setBgImageUrl('')}
                    className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
                <div className="flex gap-3">
                <Button onClick={() => bg.fileInputRef.current?.click()} disabled={uploading} variant="outline" size="sm">
                  {uploading ? 'Subiendo...' : bgImageUrl ? 'Cambiar fondo' : 'Subir fondo'}
                </Button>
                <span className="text-xs text-muted-foreground self-center">1920×1080 · Máx 5MB</span>
              </div>
              <input ref={bg.fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
              {bgImageUrl && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-foreground">color de capa</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
                      <Input type="text" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)}
                        className="h-12 rounded-xl font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-foreground">Opacidad — {bgOpacity}%</label>
                    <input type="range" min="0" max="100" value={bgOpacity}
                      onChange={(e) => setBgOpacity(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }} />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Transparente</span><span>Opaco</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Guardar */}
          <div className="flex gap-2">
            <Button onClick={saveBranding} disabled={saving} size="lg" className="flex-1">
              {saving ? 'Guardando...' : 'Guardar apariencia'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              setPrimaryColor('#059669'); setBgColor('#111827'); setCardBgColor('#1f2937');
              setTextColor('#ffffff'); setMutedColor('#e6e6e6'); setCaptionColor('#e6e6e6');
              setOverlayColor('#111827'); setBgOpacity(80); setHeaderOpacity(26);
              setSelectedThemeId('');
            }} title="Restaurar valores predeterminados">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ── Right: Phone Preview ─────────────────────────────────────── */}
        <PhonePreview
          bgColor={bgColor}
          primaryColor={primaryColor}
          headerOpacity={headerOpacity}
          logoUrl={logoUrl}
          title={title}
          subtitle={subtitle}
          mutedColor={mutedColor}
          textColor={textColor}
          cardBgColor={cardBgColor}
          bgImageUrl={bgImageUrl}
          overlayColor={overlayColor}
          bgOpacity={bgOpacity}
          businessSlug={business?.slug || ''}
        />
      </div>
    </div>
  );
}
