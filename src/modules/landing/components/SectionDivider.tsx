import type { LandingDivider } from '../types';
import { getDividerPath, clampDividerHeight, DIVIDER_VIEWBOX } from '../lib/dividers';

interface SectionDividerProps {
  /** Configuración guardada en sections.dividers */
  divider: LandingDivider | undefined | null;
  /** Color de la sección de ABAJO. Es lo único que se pinta. */
  color: string;
}

/**
 * Separador de onda entre dos secciones.
 *
 * Estrategia: OVERLAP.
 * El contenedor NO pinta fondo propio y se sube con marginTop negativo, por lo
 * que se monta sobre los últimos px de la sección anterior. Solo se pinta el
 * <path> con el color de la sección siguiente.
 *
 * Consecuencia buscada: el fondo de la sección de arriba (color plano O imagen
 * de fondo) se ve por detrás de la curva. Funciona igual con hero de color y
 * con hero con imagen, sin tocar los templates de hero.
 *
 * Notas de stacking:
 *  - position:relative sin z-index alto → queda POR ENCIMA del fondo absoluto
 *    de la sección anterior, pero POR DEBAJO de su contenido (que usa z-10).
 *    Preferimos que un botón tape la onda antes que la onda tape un botón.
 *  - pointerEvents:none para no bloquear clicks del contenido de arriba.
 */
export function SectionDivider({ divider, color }: SectionDividerProps) {
  if (!divider?.enabled) return null;

  const height = clampDividerHeight(divider.height);
  const path = getDividerPath(divider.shape);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        zIndex: 1,
        marginTop: -height,
        lineHeight: 0,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox={DIVIDER_VIEWBOX}
        preserveAspectRatio="none"
        focusable="false"
        style={{
          display: 'block',
          width: '100%',
          height,
          transform: divider.flip ? 'scaleX(-1)' : undefined,
        }}
      >
        <path d={path} fill={color} />
      </svg>
    </div>
  );
}