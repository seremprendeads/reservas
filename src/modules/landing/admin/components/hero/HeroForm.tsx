import { Trash2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Separator } from '../../../../../components/ui/separator';
import type { HeroData, HeroTemplate } from '../../../sections/hero/types';
import { isValidVideoUrl } from '../../../sections/hero/helpers';

interface HeroFormProps {
  data: HeroData;
  onChange: (data: HeroData) => void;
  triggerUpload: (target: string) => void;
  uploadingImage: string | null;
}

export function HeroForm({ data, onChange, triggerUpload, uploadingImage }: HeroFormProps) {
  const update = <K extends keyof HeroData>(key: K, value: HeroData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground">Título</label>
          <Input value={data.title} onChange={e => update('title', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Tu negocio de confianza" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Subtítulo</label>
          <Input value={data.subtitle} onChange={e => update('subtitle', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Descripción breve" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Descripción (opcional)</label>
          <Input value={data.description} onChange={e => update('description', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Texto descriptivo adicional" />
        </div>
      </div>

      <Separator />

      <div className="space-y-5">
        <label className="text-sm font-medium text-foreground">Botones</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Texto botón principal</label>
            <Input value={data.primary_button_text} onChange={e => update('primary_button_text', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Reservar Turno" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">URL botón principal</label>
            <Input value={data.primary_button_url} onChange={e => update('primary_button_url', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="#contacto" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Texto botón secundario</label>
            <Input value={data.secondary_button_text} onChange={e => update('secondary_button_text', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Conocer más" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">URL botón secundario</label>
            <Input value={data.secondary_button_url} onChange={e => update('secondary_button_url', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="#nosotros" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-5">
        <label className="text-sm font-medium text-foreground">Fondo</label>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-2.5">
              <input type="color" value={data.background_color}
                onChange={e => update('background_color', e.target.value)}
                className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
              <Input type="text" value={data.background_color}
                onChange={e => update('background_color', e.target.value)}
                className="h-9 font-mono text-xs w-28" />
            </div>
          </div>
        </div>

        {(data.hero_template === 'centered' || data.hero_template === 'video' || data.hero_template === 'image') && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo (opcional)</label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => triggerUpload('hero_bg_image')} disabled={!!uploadingImage}>
                {uploadingImage === 'hero_bg_image' ? 'Subiendo...' : data.background_image ? 'Cambiar' : 'Subir imagen'}
              </Button>
              {data.background_image && (
                <>
                  <img src={data.background_image} alt="" className="h-16 w-32 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update('background_image', null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {data.background_image && (
              <div className="mt-3">
                <label className="text-sm font-medium text-foreground">Opacidad capa de color — {data.overlay_opacity}%</label>
                <input type="range" min="0" max="100" value={data.overlay_opacity}
                  onChange={e => update('overlay_opacity', Number(e.target.value))}
                  className="w-full mt-1" />
              </div>
            )}
          </div>
        )}

        {data.hero_template === 'image' && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Imagen de portada</label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => triggerUpload('hero_cover_image')} disabled={!!uploadingImage}>
                {uploadingImage === 'hero_cover_image' ? 'Subiendo...' : data.cover_image ? 'Cambiar' : 'Subir imagen'}
              </Button>
              {data.cover_image && (
                <>
                  <img src={data.cover_image} alt="" className="h-16 w-16 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update('cover_image', null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {data.hero_template === 'video' && (
          <div>
            <label className="text-sm font-medium text-foreground">URL del video (YouTube o Vimeo)</label>
            <Input value={data.video_url} onChange={e => update('video_url', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="https://youtube.com/watch?v=..." />
            {data.video_url && !isValidVideoUrl(data.video_url) && (
              <p className="text-xs text-amber-500 mt-1">URL no válida. Usá un enlace de YouTube o Vimeo.</p>
            )}
            {data.video_url && isValidVideoUrl(data.video_url) && (
              <p className="text-xs text-emerald-500 mt-1">URL válida</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
