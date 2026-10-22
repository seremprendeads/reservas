import { Trash2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Separator } from '../../../../../components/ui/separator';
import type { HeroData } from '../../../sections/hero/types';
import { isValidVideoUrl } from '../../../sections/hero/helpers';
import type { LandingTheme } from '../../../types';
import { ButtonStyleFields } from '../ButtonStyleFields';

interface HeroFormProps {
  data: HeroData;
  onChange: (data: HeroData) => void;
  triggerUpload: (target: string) => void;
  uploadingImage: string | null;
  theme: LandingTheme;
  updateTheme: (k: string, v: string) => void;
}

// Tamaño (px) y color inline para un texto del Hero. null = usar el estilo
// por defecto de la plantilla — el botón "Restablecer" vuelve a null.
// El color del título, el subtítulo y la descripción se guarda en el theme
// de la sección (hero_title_color, hero_subtitle_color, hero_text_color) y
// pisa al color que el Hero tenía guardado, que queda como valor previo.
function TextStyleRow({
  size, color, onSizeChange, onColorChange, onResetColor,
  weight, italic, transform, onWeightChange, onItalicChange, onTransformChange,
}: {
  size: number | null; color: string;
  onSizeChange: (v: number | null) => void;
  onColorChange: (v: string) => void;
  onResetColor: () => void;
  weight?: string; italic?: string; transform?: string;
  onWeightChange?: (v: string) => void;
  onItalicChange?: (v: string) => void;
  onTransformChange?: (v: string) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-4">
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
          <button
            type="button"
            onClick={onResetColor}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Automático
          </button>
        </div>
      </div>
      {onWeightChange && onItalicChange && onTransformChange && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={weight || ''}
            onChange={e => onWeightChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
          >
            <option value="">Peso auto</option>
            <option value="400">Normal</option>
            <option value="600">Semi negrita</option>
            <option value="700">Negrita</option>
          </select>
          <button
            type="button"
            onClick={() => onItalicChange(italic === 'italic' ? '' : 'italic')}
            aria-pressed={italic === 'italic'}
            className={`h-8 rounded-lg border px-3 text-xs italic transition-colors ${
              italic === 'italic'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            Cursiva
          </button>
          <select
            value={transform || ''}
            onChange={e => onTransformChange(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
          >
            <option value="">Letra auto</option>
            <option value="uppercase">MAYÚSCULAS</option>
            <option value="lowercase">minúsculas</option>
          </select>
        </div>
      )}
    </div>
  );
}

export function HeroForm({ data, onChange, triggerUpload, uploadingImage, theme, updateTheme }: HeroFormProps) {
  const update = <K extends keyof HeroData>(key: K, value: HeroData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // Con la plantilla de imagen y sin foto de fondo los textos se leen sobre
  // el color plano del hero, asi que usan el color de texto del tema en vez
  // de blanco. Son los mismos defaults que aplica la sección publica.
  const hasBgImage = !!data.background_image;
  const isImageWithoutBg = data.hero_template === 'image' && !hasBgImage;
  const defaultTitleColor = isImageWithoutBg ? theme.text_color : '#ffffff';
  const defaultSubtitleColor = isImageWithoutBg ? '#666666' : 'rgba(255,255,255,0.65)';
  const defaultDescriptionColor = isImageWithoutBg ? '#888888' : 'rgba(255,255,255,0.5)';

  const titleColor = theme.hero_title_color || data.title_color || defaultTitleColor;
  const subtitleColor = theme.hero_subtitle_color || data.subtitle_color || defaultSubtitleColor;
  const descriptionColor = theme.hero_text_color || data.description_color || defaultDescriptionColor;

  // El tamaño ahora se guarda en el theme (igual que en el resto de las
  // secciones). El valor del hero queda como respaldo para las landings que ya
  // lo tenían guardado.
  const sizeValue = (themeSize: string | undefined, dataSize: number | null) => {
    const v = themeSize || (dataSize != null ? String(dataSize) : '');
    return v === '' ? null : Number(v);
  };
  const setSize = (themeKey: string, dataKey: 'title_size' | 'subtitle_size' | 'description_size') => (v: number | null) => {
    updateTheme(themeKey, v == null ? '' : String(v));
    update(dataKey, null);
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
              size={data.logo_caption_size} color={data.logo_caption_color || 'rgba(255,255,255,0.5)'}
              onSizeChange={v => update('logo_caption_size', v)}
              onColorChange={v => update('logo_caption_color', v)}
              onResetColor={() => update('logo_caption_color', null)}
              weight={data.logo_caption_weight || ''} italic={data.logo_caption_italic || ''} transform={data.logo_caption_transform || ''}
              onWeightChange={v => update('logo_caption_weight', v || null)}
              onItalicChange={v => update('logo_caption_italic', v || null)}
              onTransformChange={v => update('logo_caption_transform', v || null)}
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-foreground">Título</label>
          <Input value={data.title} onChange={e => update('title', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Tu negocio de confianza" />
          <TextStyleRow
            size={sizeValue(theme.hero_title_size, data.title_size)} color={titleColor}
            onSizeChange={setSize('hero_title_size', 'title_size')}
            onColorChange={v => updateTheme('hero_title_color', v)}
            onResetColor={() => { updateTheme('hero_title_color', ''); update('title_color', null); }}
            weight={theme.hero_title_weight} italic={theme.hero_title_italic} transform={theme.hero_title_transform}
            onWeightChange={v => updateTheme('hero_title_weight', v)}
            onItalicChange={v => updateTheme('hero_title_italic', v)}
            onTransformChange={v => updateTheme('hero_title_transform', v)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Subtítulo</label>
          <Input value={data.subtitle} onChange={e => update('subtitle', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Descripción breve" />
          <TextStyleRow
            size={sizeValue(theme.hero_subtitle_size, data.subtitle_size)} color={subtitleColor}
            onSizeChange={setSize('hero_subtitle_size', 'subtitle_size')}
            onColorChange={v => updateTheme('hero_subtitle_color', v)}
            onResetColor={() => { updateTheme('hero_subtitle_color', ''); update('subtitle_color', null); }}
            weight={theme.hero_subtitle_weight} italic={theme.hero_subtitle_italic} transform={theme.hero_subtitle_transform}
            onWeightChange={v => updateTheme('hero_subtitle_weight', v)}
            onItalicChange={v => updateTheme('hero_subtitle_italic', v)}
            onTransformChange={v => updateTheme('hero_subtitle_transform', v)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Descripción (opcional)</label>
          <Input value={data.description} onChange={e => update('description', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="Texto descriptivo adicional" />
          <TextStyleRow
            size={sizeValue(theme.hero_text_size, data.description_size)} color={descriptionColor}
            onSizeChange={setSize('hero_text_size', 'description_size')}
            onColorChange={v => updateTheme('hero_text_color', v)}
            onResetColor={() => { updateTheme('hero_text_color', ''); update('description_color', null); }}
            weight={theme.hero_text_weight} italic={theme.hero_text_italic} transform={theme.hero_text_transform}
            onWeightChange={v => updateTheme('hero_text_weight', v)}
            onItalicChange={v => updateTheme('hero_text_italic', v)}
            onTransformChange={v => updateTheme('hero_text_transform', v)}
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

      <ButtonStyleFields baseKey="hero_primary" label="Botón principal" theme={theme} updateTheme={updateTheme} defaultBg={theme.button_color} />
      <ButtonStyleFields baseKey="hero_secondary" label="Botón secundario" theme={theme} updateTheme={updateTheme} />

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
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => (update as (k: string, v: unknown) => void)('cover_image', null)}>
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
            <Input value={data.video_url} onChange={e => (update as (k: string, v: unknown) => void)('video_url', e.target.value)} className="mt-1.5 h-12 rounded-xl" placeholder="https://youtube.com/watch?v=..." />
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
