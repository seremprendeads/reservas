const POSITIONS = [
  '0% 0%', '50% 0%', '100% 0%',
  '0% 50%', '50% 50%', '100% 50%',
  '0% 100%', '50% 100%', '100% 100%',
];

interface ImagePositionFieldProps {
  imageUrl?: string | null;
  value?: string;
  onChange: (value: string) => void;
}

/**
 * Selector de encuadre para una imagen de fondo. Se muestra como una grilla de
 * nueve posiciones que recorta la misma foto, para elegir qué parte queda a la
 * vista cuando la sección la recorta.
 */
export function ImagePositionField({ imageUrl, value, onChange }: ImagePositionFieldProps) {
  const current = value || '50% 50%';

  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Encuadre de la imagen</label>
      <div className="inline-grid grid-cols-3 gap-1">
        {POSITIONS.map(pos => {
          const active = current === pos;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos)}
              className={`h-9 w-9 rounded-md border transition-colors ${
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
              }`}
              style={{
                backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
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
  );
}
