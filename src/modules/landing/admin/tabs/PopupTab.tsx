import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface PopupTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function PopupTab({ sections, updateSection, triggerUpload, uploadingImage }: PopupTabProps) {
  const p = sections.popup ?? { enabled: false, title: '', subtitle: '', description: '', button_text: '', button_url: '', image_url: null, overlay_color: '#111827', overlay_opacity: 80 };
  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
        <input
          type="checkbox"
          checked={p.enabled}
          onChange={() => updateSection('popup', { ...p, enabled: !p.enabled })}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium text-foreground">Activar popup de marketing</span>
      </label>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={p.title} onChange={e => updateSection('popup', { ...p, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="¡Oferta especial!" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={p.subtitle} onChange={e => updateSection('popup', { ...p, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="No te pierdas nuestras promociones" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción</label>
        <textarea
          value={p.description}
          onChange={e => updateSection('popup', { ...p, description: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[80px] resize-none"
          placeholder="Describí tu oferta o promoción..."
        />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground">Texto del botón</label>
        <Input value={p.button_text} onChange={e => updateSection('popup', { ...p, button_text: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Ver oferta" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">URL del botón</label>
        <Input value={p.button_url} onChange={e => updateSection('popup', { ...p, button_url: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="#contacto o https://..." />
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('popup_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'popup_image' ? 'Subiendo...' : p.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {p.image_url && (
            <>
              <img src={p.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('popup', { ...p, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {p.image_url && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground">Color de capa</label>
            <div className="flex items-center gap-2.5 mt-1.5">
              <input type="color" value={p.overlay_color}
                onChange={e => updateSection('popup', { ...p, overlay_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
              <Input type="text" value={p.overlay_color}
                onChange={e => updateSection('popup', { ...p, overlay_color: e.target.value })}
                className="h-9 font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Opacidad de capa — {p.overlay_opacity}%</label>
            <input type="range" min="0" max="100" value={p.overlay_opacity}
              onChange={e => updateSection('popup', { ...p, overlay_opacity: Number(e.target.value) })}
              className="w-full mt-1" />
          </div>
        </>
      )}
    </div>
  );
}
