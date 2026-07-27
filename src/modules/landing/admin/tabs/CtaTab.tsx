import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface CtaTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function CtaTab({ sections, updateSection, triggerUpload, uploadingImage }: CtaTabProps) {
  const c = sections.cta;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={c.title} onChange={e => updateSection('cta', { ...c, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción</label>
        <Input value={c.description} onChange={e => updateSection('cta', { ...c, description: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Texto del botón</label>
        <Input value={c.button_text} onChange={e => updateSection('cta', { ...c, button_text: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Acción del botón</label>
        <select value={c.button_action} onChange={e => updateSection('cta', { ...c, button_action: e.target.value })}
          className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="booking">Reservar Turno</option>
          <option value="info">Solicitar Información</option>
        </select>
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('cta_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'cta_image' ? 'Subiendo...' : c.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {c.image_url && (
            <>
              <img src={c.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('cta', { ...c, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {c.image_url && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground">Color de capa</label>
            <div className="flex items-center gap-2.5 mt-1.5">
              <input type="color" value={c.overlay_color}
                onChange={e => updateSection('cta', { ...c, overlay_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
              <Input type="text" value={c.overlay_color}
                onChange={e => updateSection('cta', { ...c, overlay_color: e.target.value })}
                className="h-9 font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Opacidad de capa — {c.overlay_opacity}%</label>
            <input type="range" min="0" max="100" value={c.overlay_opacity}
              onChange={e => updateSection('cta', { ...c, overlay_opacity: Number(e.target.value) })}
              className="w-full mt-1" />
          </div>
        </>
      )}
    </div>
  );
}
