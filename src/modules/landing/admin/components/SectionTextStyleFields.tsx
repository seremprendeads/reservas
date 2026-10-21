import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SECTION_TEXT_STYLE_GROUPS, type LandingTheme } from '../../types';

type Slot = 'title' | 'subtitle' | 'text';

const SLOT_HINTS: Record<string, string> = {
  'Título': 'Los encabezados de la sección.',
  'Subtítulo': 'La línea de entrada, debajo del título.',
  'Texto': 'El cuerpo de texto (descripciones, tarjetas, listas).',
  'Título de beneficios': 'El título de cada beneficio.',
  'Subtítulo de beneficios': 'El subtítulo de cada beneficio.',
};

const SLOT_BY_LABEL: Partial<Record<string, Slot>> = {
  'Título': 'title',
  'Subtítulo': 'subtitle',
  'Texto': 'text',
};

interface SectionTextStyleFieldsProps {
  sectionKey: string;
  theme: LandingTheme;
  updateTheme: (k: string, v: string) => void;
  // Colores que se muestran en el selector mientras el control está en
  // "Automático", para que el usuario vea a qué color va a caer si no lo
  // toca. Si no se pasan, se usa el color de texto general del sitio.
  fallbacks?: Partial<Record<Slot, string>>;
  // Valor que se escribe en el theme al tocar "Automático". Por defecto es
  // vacío (heredar); el footer lo usa para volver al color de texto que ya
  // tenía (footer_text_color) en lugar de dejarlo sin definir.
  autoValues?: Partial<Record<Slot, string>>;
}

/**
 * Bloque "Estilos de texto de la sección" que se agrega al final de la
 * pestaña de cada sección del constructor. Muestra, por cada tipo de texto,
 * el tamaño en px y el color, igual que en la Cabecera.
 *
 * Todo arranca en "Automático": si el negocio no lo toca, la sección se ve
 * exactamente como antes.
 */
export function SectionTextStyleFields({
  sectionKey, theme, updateTheme, fallbacks, autoValues,
}: SectionTextStyleFieldsProps) {
  const group = SECTION_TEXT_STYLE_GROUPS.find(g => g.key === sectionKey);
  if (!group) return null;

  const base = theme.text_color || '#111111';

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Tamaños y colores de texto</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Cambian solo esta sección. En Automático se usa el tamaño y el color que ya tenía.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {group.slots.map(slot => {
            const color = (theme[slot.color] as string | undefined) || '';
            const size = slot.size ? (theme[slot.size] as string | undefined) || '' : '';
            const baseKey = slot.styleKey || String(slot.color).replace(/_color$/, '');
            const weight = theme[`${baseKey}_weight`] || '';
            const italic = theme[`${baseKey}_italic`] || '';
            const transform = theme[`${baseKey}_transform`] || '';
            const legacySlot = SLOT_BY_LABEL[slot.label];
            const hint = SLOT_HINTS[slot.label] || '';
            const isAuto = !color && !size && !weight && !italic && !transform;
            const effectiveColor = color || (legacySlot && fallbacks?.[legacySlot]) || base;

            return (
              <div key={slot.color} className="space-y-1 rounded-xl border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-foreground">{slot.label}</label>
                  <button
                    type="button"
                    onClick={() => {
                      updateTheme(slot.color as string, (legacySlot && autoValues?.[legacySlot]) || '');
                      if (slot.size) updateTheme(slot.size as string, '');
                      updateTheme(`${baseKey}_weight`, '');
                      updateTheme(`${baseKey}_italic`, '');
                      updateTheme(`${baseKey}_transform`, '');
                    }}
                    disabled={isAuto}
                    className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
                  >
                    Automático
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {slot.size && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Tamaño</span>
                      <input
                        type="number"
                        min={8}
                        max={160}
                        placeholder="Auto"
                        value={size}
                        onChange={e => updateTheme(slot.size as string, e.target.value)}
                        className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs"
                      />
                      <span className="text-[11px] text-muted-foreground">px</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Color</span>
                    <input
                      type="color"
                      value={effectiveColor || '#000000'}
                      onChange={e => updateTheme(slot.color as string, e.target.value)}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
                    />
                    <Input
                      type="text"
                      value={effectiveColor}
                      readOnly={!color}
                      onChange={e => updateTheme(slot.color as string, e.target.value)}
                      className={`h-8 w-28 font-mono text-xs ${color ? '' : 'opacity-60'}`}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Peso</span>
                    <select
                      value={weight}
                      onChange={e => updateTheme(`${baseKey}_weight`, e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Auto</option>
                      <option value="400">Normal</option>
                      <option value="600">Semi negrita</option>
                      <option value="700">Negrita</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTheme(`${baseKey}_italic`, italic ? '' : 'italic')}
                    aria-pressed={italic === 'italic'}
                    className={`h-8 rounded-lg border px-3 text-xs italic transition-colors ${
                      italic === 'italic'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Cursiva
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Letra</span>
                    <select
                      value={transform}
                      onChange={e => updateTheme(`${baseKey}_transform`, e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Auto</option>
                      <option value="uppercase">MAYÚSCULAS</option>
                      <option value="lowercase">minúsculas</option>
                    </select>
                  </div>
                </div>
                {hint && (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {isAuto ? `Automático: ${hint}` : hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
