import { Input } from '../../../../components/ui/input';

interface SectionColorFieldProps {
  label: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
  description?: string;
}

/**
 * Control de color de una sección (fondo o tarjetas). Se usa dentro de la
 * pestaña de cada sección para que el negocio ajuste sus colores sin tener
 * que ir a Diseño. Si el valor está vacío se muestra el color por defecto.
 */
export function SectionColorField({
  label, value, fallback, onChange, description,
}: SectionColorFieldProps) {
  const effective = value || fallback;

  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={effective || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
        />
        <Input
          type="text"
          value={effective}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-32 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => onChange(fallback)}
          className="text-[11px] text-primary hover:underline"
        >
          Restablecer
        </button>
        {!value && (
          <span className="text-[11px] text-muted-foreground">Automático</span>
        )}
      </div>
    </div>
  );
}
