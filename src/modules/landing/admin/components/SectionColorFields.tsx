import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SECTION_COLOR_GROUPS, type LandingTheme } from '../../types';

type Slot = 'title' | 'subtitle' | 'text';

const SLOT_LABELS: Record<Slot, string> = {
  title: 'Título',
  subtitle: 'Subtítulo',
  text: 'Texto',
};

const SLOT_HINTS: Record<Slot, string> = {
  title: 'Los encabezados de la sección.',
  subtitle: 'La línea de entrada, debajo del título.',
  text: 'El cuerpo de texto (descripciones, tarjetas, listas).',
};

interface SectionColorFieldsProps {
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

// Una fila de color con estado "Automático" (vacío). Un <input type="color">
// no puede representar "sin color", así que mientras está en Automático se
// muestra el color heredado y el campo de texto queda bloqueado: el botón
// "Automático" es el que vuelve al modo por defecto.
export function ColorRow({
  label, hint, value, fallback, onChange,
}: {
  label: string; hint: string; value: string; fallback: string; onChange: (v: string) => void;
}) {
  const isAuto = !value;
  const effective = isAuto ? fallback : value;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-muted-foreground">{label}</label>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={isAuto}
          className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
        >
          Automático
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={effective || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-lg border bg-transparent p-0.5 shrink-0"
        />
        <Input
          type="text"
          value={effective}
          readOnly={isAuto}
          onChange={e => onChange(e.target.value)}
          className={`h-8 font-mono text-xs ${isAuto ? 'opacity-60' : ''}`}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {isAuto ? `Automático: ${hint}` : hint}
      </p>
    </div>
  );
}

/**
 * Bloque "Colores de la sección" que se agrega al final de la pestaña de
 * cada sección del constructor. Permite cambiar por separado el color de los
 * títulos, del subtítulo y del cuerpo de texto de esa sección.
 *
 * Los tres controles son "Automático" por omisión: si el negocio no los
 * toca, la sección se ve exactamente como antes.
 */
export function SectionColorFields({ sectionKey, theme, updateTheme, fallbacks, autoValues }: SectionColorFieldsProps) {
  const group = SECTION_COLOR_GROUPS.find(g => g.key === sectionKey);
  if (!group) return null;

  const base = theme.text_color || '#111111';
  const getFallback = (slot: Slot) => fallbacks?.[slot] || base;

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Colores de la sección</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Cambian solo esta sección. En Automático se usa el color que ya tenía.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {(['title', 'subtitle', 'text'] as Slot[]).map(slot => (
            <ColorRow
              key={slot}
              label={SLOT_LABELS[slot]}
              hint={SLOT_HINTS[slot]}
              value={(theme[group.slots[slot]] as string | undefined) || ''}
              fallback={getFallback(slot)}
              onChange={v => updateTheme(group.slots[slot] as string, v === '' ? (autoValues?.[slot] ?? '') : v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
