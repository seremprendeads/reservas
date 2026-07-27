import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';
import { DEFAULT_SECTIONS } from '../../config';

interface ShopInviteTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function ShopInviteTab({ sections, updateSection, triggerUpload, uploadingImage }: ShopInviteTabProps) {
  const si = { ...DEFAULT_SECTIONS.shop_invite, ...(sections.shop_invite || {}) };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={si.title} onChange={e => updateSection('shop_invite', { ...si, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Visitanos en nuestra Tienda" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={si.subtitle} onChange={e => updateSection('shop_invite', { ...si, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Descubrí todos nuestros productos" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Texto del botón</label>
        <Input value={si.button_text} onChange={e => updateSection('shop_invite', { ...si, button_text: e.target.value.toUpperCase() })} className="mt-1.5 h-12 rounded-xl uppercase" placeholder="IR A LA TIENDA" />
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('shop_invite_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'shop_invite_image' ? 'Subiendo...' : si.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {si.image_url && (
            <>
              <img src={si.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('shop_invite', { ...si, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {si.image_url && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground">Color de capa</label>
            <div className="flex items-center gap-2.5 mt-1.5">
              <input type="color" value={si.overlay_color}
                onChange={e => updateSection('shop_invite', { ...si, overlay_color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
              <Input type="text" value={si.overlay_color}
                onChange={e => updateSection('shop_invite', { ...si, overlay_color: e.target.value })}
                className="h-9 font-mono text-xs" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Opacidad de capa — {si.overlay_opacity}%</label>
            <input type="range" min="0" max="100" value={si.overlay_opacity}
              onChange={e => updateSection('shop_invite', { ...si, overlay_opacity: Number(e.target.value) })}
              className="w-full mt-1" />
          </div>
        </>
      )}
    </div>
  );
}
