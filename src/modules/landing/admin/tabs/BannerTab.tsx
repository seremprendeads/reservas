import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface BannerTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function BannerTab({ sections, updateSection, triggerUpload, uploadingImage }: BannerTabProps) {
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
    </div>
  );
}
