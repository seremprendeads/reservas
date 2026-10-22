import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingTheme } from '../../types';

interface ButtonStyleFieldsProps {
  baseKey: string;
  label: string;
  theme: LandingTheme;
  updateTheme: (k: string, v: string) => void;
  defaultColor?: string;
  defaultBg?: string;
}

export function ButtonStyleFields({
  baseKey, label, theme, updateTheme, defaultColor = '#ffffff', defaultBg,
}: ButtonStyleFieldsProps) {
  const bgKey = `${baseKey}_bg`;
  const colorKey = `${baseKey}_color`;
  const sizeKey = `${baseKey}_size`;
  const weightKey = `${baseKey}_weight`;
  const italicKey = `${baseKey}_italic`;
  const transformKey = `${baseKey}_transform`;

  const bg = (theme[bgKey] as string | undefined) || '';
  const color = (theme[colorKey] as string | undefined) || '';
  const size = (theme[sizeKey] as string | undefined) || '';
  const weight = theme[weightKey] || '';
  const italic = theme[italicKey] || '';
  const transform = theme[transformKey] || '';
  const isAuto = !bg && !color && !size && !weight && !italic && !transform;
  const effectiveColor = color || defaultColor;

  const reset = () => {
    updateTheme(bgKey, '');
    updateTheme(colorKey, '');
    updateTheme(sizeKey, '');
    updateTheme(weightKey, '');
    updateTheme(italicKey, '');
    updateTheme(transformKey, '');
  };

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Estilo del botón</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Cambia el texto de “{label}”. En Automático se usa el estilo que ya tenía.
        </p>
        <div className="space-y-1 rounded-xl border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-foreground">{label}</label>
            <button
              type="button"
              onClick={reset}
              disabled={isAuto}
              className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
            >
              Automático
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Fondo</span>
              <input
                type="color"
                value={bg || defaultBg || '#000000'}
                onChange={e => updateTheme(bgKey, e.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
              />
              <Input
                type="text"
                value={bg}
                readOnly={!bg}
                placeholder="Automático"
                onChange={e => updateTheme(bgKey, e.target.value)}
                className={`h-8 w-28 font-mono text-xs ${bg ? '' : 'opacity-60'}`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Tamaño</span>
              <input
                type="number"
                min={8}
                max={160}
                placeholder="Auto"
                value={size}
                onChange={e => updateTheme(sizeKey, e.target.value)}
                className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs"
              />
              <span className="text-[11px] text-muted-foreground">px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Color</span>
              <input
                type="color"
                value={effectiveColor || '#000000'}
                onChange={e => updateTheme(colorKey, e.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
              />
              <Input
                type="text"
                value={effectiveColor}
                readOnly={!color}
                onChange={e => updateTheme(colorKey, e.target.value)}
                className={`h-8 w-28 font-mono text-xs ${color ? '' : 'opacity-60'}`}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Peso</span>
              <select
                value={weight}
                onChange={e => updateTheme(weightKey, e.target.value)}
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
              onClick={() => updateTheme(italicKey, italic ? '' : 'italic')}
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
                onChange={e => updateTheme(transformKey, e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">Auto</option>
                <option value="uppercase">MAYÚSCULAS</option>
                <option value="lowercase">minúsculas</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
