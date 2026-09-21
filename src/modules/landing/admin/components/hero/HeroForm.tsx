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

// Tamaño (px) y color inline para un texto del Hero. null = usar el estilo
// por defecto de la plantilla — el botón "Restablecer" vuelve a null.
function TextStyleRow({
  size, color, onSizeChange, onColorChange,
}: {
  size: number | null; color: string | null;
  onSizeChange: (v: number | null) => void; onColorChange: (v: string | null) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground">Tamaño</label>
        <input
          type="number" min={8} max={160}
          placeholder="Auto"
          value={size ?? ''}
          onChange={e => onSizeChange(e.target.value === '' ? null : Number(e.target.value))}
          className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-muted-foreground">Color</label>
        <input
          type="color"
          value={color || '#000000'}
          onChange={e => onColorChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-lg border bg-transparent p-0.5"
        />
        {(size !== null || color !== null) && (
          <button
            type="button"
            onClick={() => { onSizeChange(null); onColorChange(null); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Restablecer
          </button>
        )}
      </div>
    </div>
  );
}

export function HeroForm({ data, onChange, triggerUpload, uploadingImage }: HeroFormProps) {
  const update = <K extends keyof HeroData>(key: K, value: HeroData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Logo (opcional)</label>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => triggerUpload('hero_logo_image')} disabled={!!uploadingImage}>
              {uploadingImage === 'hero_logo_image' ? 'Subiendo...' : data.logo_url ? 'Cambiar' : 'Subir logo'}
            </Button>
            {data.logo_url && (
              <>
                <img src={data.logo_url} alt="" className="h-12 w-auto max-w-[140px] rounded-lg object-contain border bg-muted/20 p-1" />
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update('logo_url', null)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Se muestra arriba del título. Recomendado: PNG con fondo transparente, no se recorta.
          </p>
        </div>
        {data.logo_url && (
          <div>
            <label className="text-sm font-medium text-foreground">Texto debajo del logo (opcional)</label>
            <Input value={data.logo_caption} onChange={e => update('logo_caption', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Ej: Desde 2020" />
            <TextStyleRow
              size={data.logo_caption_size} color={data.logo_caption_color}
              onSizeChange={v => update('logo_caption_size', v)} onColorChange={v => update('logo_caption_color', v)}
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-foreground">Título</label>
          <Input value={data.title} onChange={e => update('title', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Tu negocio de confianza" />
          <TextStyleRow
            size={data.title_size} color={data.title_color}
            onSizeChange={v => update('title_size', v)} onColorChange={v => update('title_color', v)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Subtítulo</label>
          <Input value={data.subtitle} onChange={e => update('subtitle', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Descripción breve" />
          <TextStyleRow
            size={data.subtitle_size} color={data.subtitle_color}
            onSizeChange={v => update('subtitle_size', v)} onColorChange={v => update('subtitle_color', v)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Descripción (opcional)</label>
          <Input value={data.description} onChange={e => update('description', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Texto descriptivo adicional" />
          <TextStyleRow
            size={data.description_size} color={data.description_color}
            onSizeChange={v => update('description_size', v)} onColorChange={v => update('description_color', v)}
          />
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
                  <img src={data.cover_image} alt="" className="h-16 w-16 rounded-xl object-cover border"
                    style={{ objectPosition: data.cover_position || '50% 50%' }} />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update('cover_image', null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>

            {/* Encuadre: el recuadro de la portada recorta la foto, asi que hay
                que poder elegir que parte queda a la vista. Nueve posiciones,
                que es lo que se entiende sin explicacion. */}
            {data.cover_image && (
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Encuadre de la imagen</label>
                <div className="inline-grid grid-cols-3 gap-1">
                  {[
                    ['0% 0%', '50% 0%', '100% 0%'],
                    ['0% 50%', '50% 50%', '100% 50%'],
                    ['0% 100%', '50% 100%', '100% 100%'],
                  ].flat().map((pos) => {
                    const activo = (data.cover_position || '50% 50%') === pos;
                    return (
                      <button
                        key={pos}
                        type="button"
                        // update() esta tipado solo con los campos comunes del
                        // hero; cover_position es propio de la plantilla con
                        // imagen, igual que cover_image.
                        onClick={() => (update as (k: string, v: unknown) => void)('cover_position', pos)}
                        className={`h-9 w-9 rounded-md border transition-colors ${
                          activo ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                        }`}
                        style={{
                          backgroundImage: `url(${data.cover_image})`,
                          backgroundSize: '300% 300%',
                          backgroundPosition: pos,
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Elegí qué parte de la foto querés que se vea. Útil cuando la portada te corta una cara.
                </p>
              </div>
            )}
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
