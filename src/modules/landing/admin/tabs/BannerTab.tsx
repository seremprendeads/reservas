import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import type { LandingSections, LandingTheme } from '../../types';

interface BannerTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function BannerTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: BannerTabProps) {
  const b = sections.banner;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={b.title} onChange={e => updateSection('banner', { ...b, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={b.subtitle} onChange={e => updateSection('banner', { ...b, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Texto</label>
        <textarea value={b.description || ''} onChange={e => updateSection('banner', { ...b, description: e.target.value })} rows={3}
          placeholder="Párrafo opcional debajo del subtítulo..."
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('banner_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'banner_image' ? 'Subiendo...' : b.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {b.image_url && (
            <>
              <img src={b.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('banner', { ...b, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {b.image_url && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground">Color de capa</label>
            <div className="flex items-center gap-2.5 mt-1.5">
              <input type="color" value={b.overlay_color}
                onChange={e => updateSection('banner', { ...b, overlay_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
              <Input type="text" value={b.overlay_color}
                onChange={e => updateSection('banner', { ...b, overlay_color: e.target.value })}
                className="h-9 font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Opacidad de capa — {b.overlay_opacity}%</label>
            <input type="range" min="0" max="100" value={b.overlay_opacity}
              onChange={e => updateSection('banner', { ...b, overlay_opacity: Number(e.target.value) })}
              className="w-full mt-1" />
          </div>
        </>
      )}

      <SectionBackgroundFields
        imageUrl={b.image_url}
        fixed={b.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        hideUpload
        onFixedChange={v => updateSection('banner', { ...b, background_fixed: v })}
      />

      <SectionTextStyleFields
        sectionKey="banner"
        theme={theme}
        updateTheme={updateTheme}
        fallbacks={{ title: '#ffffff', subtitle: 'rgba(255,255,255,0.7)', text: 'rgba(255,255,255,0.5)' }}
      />
    </div>
  );
}
