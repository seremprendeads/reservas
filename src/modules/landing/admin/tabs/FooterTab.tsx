import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { Button } from '../../../../components/ui/button';
import { cn } from '../../../../lib/utils';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface FooterTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
  logoUrl: string;
}

export function FooterTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme, logoUrl }: FooterTabProps) {
  const f = sections.footer;
  const header = sections.header;
  const logoSize = header.logo_size || 100;
  const setHeader = (patch: Partial<LandingSections['header']>) => updateSection('header', { ...header, ...patch });
  const update = (field: string, value: string) => updateSection('footer', { ...f, [field]: value });
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className={cn(
                'border bg-muted/20',
                header.logo_shape === 'square'
                  ? 'h-12 w-auto max-w-[140px] object-contain rounded-lg p-1'
                  : 'h-12 w-12 object-cover rounded-full'
              )}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerUpload('logo')}
            disabled={!!uploadingImage}
          >
            {uploadingImage === 'logo' ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Es el mismo logo que se usa en el menú.</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="footer-logo-size" className="text-sm font-medium text-foreground">Tamaño del logo</label>
          <span className="text-sm text-muted-foreground tabular-nums">{logoSize}%</span>
        </div>
        <input
          id="footer-logo-size"
          type="range"
          min={60}
          max={140}
          step={5}
          value={logoSize}
          onChange={e => setHeader({ logo_size: Number(e.target.value) })}
          className="mt-3 w-full cursor-pointer accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Más chico</span>
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => setHeader({ logo_size: 100 })}>Restablecer</button>
          <span>Más grande</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Se comparte con el menú para que se vean del mismo tamaño.</p>
      </div>

      <Separator />

      <SectionColorField
        label="Fondo del footer"
        description="Color de fondo del pie de página."
        value={theme.footer_bg_color}
        fallback={DEFAULT_THEME.footer_bg_color}
        onChange={v => updateTheme('footer_bg_color', v)}
      />
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">Título del logo (Footer)</label>
        <Input value={f.logo_title} onChange={e => update('logo_title', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Nombre del negocio" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción del logo (Footer)</label>
        <Input value={f.logo_description} onChange={e => update('logo_description', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Subtítulo o descripción" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Frase / Descripción</label>
        <textarea value={f.frases} onChange={e => update('frases', e.target.value)} rows={3}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
          placeholder="Escribí una frase, eslogan o descripción breve..." />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">Dirección</label>
        <Input value={f.address} onChange={e => update('address', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Av. Ejemplo 1234" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">Teléfono</label>
          <Input value={f.phone} onChange={e => update('phone', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="+54 11 1234-5678" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input value={f.email} onChange={e => update('email', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="info@tu negocio.com" />
        </div>
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">WhatsApp</label>
        <Input value={f.whatsapp} onChange={e => update('whatsapp', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="+54 11 1234-5678" />
        <p className="text-xs text-muted-foreground mt-1">Lo usan el botón flotante y los botones "Consultar" de la sección Planes.</p>
      </div>
      <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
        <input
          type="checkbox"
          checked={f.whatsapp_floating_enabled}
          onChange={() => updateSection('footer', { ...f, whatsapp_floating_enabled: !f.whatsapp_floating_enabled })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium text-foreground">Mostrar burbuja flotante de WhatsApp</span>
      </label>
      <Separator />
      <p className="text-sm font-medium text-foreground">Redes sociales</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">Instagram</label>
          <Input value={f.instagram} onChange={e => update('instagram', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Facebook</label>
          <Input value={f.facebook} onChange={e => update('facebook', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="URL de Facebook" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">TikTok</label>
          <Input value={f.tiktok} onChange={e => update('tiktok', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="text-sm font-medium text-foreground">X (Twitter)</label>
          <Input value={f.x} onChange={e => update('x', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tunegocio" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">LinkedIn</label>
          <Input value={f.linkedin} onChange={e => update('linkedin', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="URL o usuario" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">YouTube</label>
          <Input value={f.youtube} onChange={e => update('youtube', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="@tucanal" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Copyright</label>
        <Input value={f.copyright} onChange={e => update('copyright', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="© 2026 Tu Negocio. Todos los derechos reservados." />
      </div>

      <SectionBackgroundFields
        imageUrl={f.background_image}
        fixed={f.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="footer_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('footer', { ...f, background_image: url })}
        onFixedChange={v => updateSection('footer', { ...f, background_fixed: v })}
        overlayColor={f.background_overlay_color}
        overlayOpacity={f.background_overlay_opacity}
        onOverlayColorChange={v => updateSection('footer', { ...f, background_overlay_color: v })}
        onOverlayOpacityChange={v => updateSection('footer', { ...f, background_overlay_opacity: v })}
        backgroundPosition={f.background_position}
        onBackgroundPositionChange={v => updateSection('footer', { ...f, background_position: v })}
      />

      <SectionTextStyleFields
        sectionKey="footer"
        theme={theme}
        updateTheme={updateTheme}
        fallbacks={{ title: theme.footer_text_color, subtitle: theme.footer_text_color, text: theme.footer_text_color }}
        autoValues={{ text: theme.footer_text_color || '#f3f4f6' }}
      />
    </div>
  );
}
