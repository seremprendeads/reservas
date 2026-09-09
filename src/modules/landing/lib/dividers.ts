// ============================================================================
// Catálogo de formas para los separadores de sección (SectionDivider).
//
// Convención de cada path:
//   - viewBox fijo "0 0 1440 100"
//   - el path SIEMPRE cierra contra el borde inferior (L1440,100 L0,100 Z)
//   - el <svg> se pinta con el color de la sección de ARRIBA
//   - el <path> se pinta con el color de la sección de ABAJO
//
// No se permite SVG arbitrario: la landing guarda solo el id de la forma.
// ============================================================================

export type DividerShapeId =
  | 'wave_soft'
  | 'wave_double'
  | 'curve'
  | 'slant'
  | 'zigzag';

export interface DividerShape {
  id: DividerShapeId;
  label: string;
  path: string;
}

export const DIVIDER_SHAPES: DividerShape[] = [
  {
    id: 'wave_soft',
    label: 'Onda suave',
    path: 'M0,64 C240,100 480,0 720,32 C960,64 1200,100 1440,48 L1440,100 L0,100 Z',
  },
  {
    id: 'wave_double',
    label: 'Onda doble',
    path: 'M0,40 C120,80 240,80 360,50 C480,20 600,20 720,45 C840,70 960,70 1080,45 C1200,20 1320,20 1440,50 L1440,100 L0,100 Z',
  },
  {
    id: 'curve',
    label: 'Curva',
    path: 'M0,100 Q720,0 1440,100 L1440,100 L0,100 Z',
  },
  {
    id: 'slant',
    label: 'Inclinado',
    path: 'M0,100 L1440,0 L1440,100 Z',
  },
  {
    id: 'zigzag',
    label: 'Zigzag',
    path: 'M0,60 L180,100 L360,60 L540,100 L720,60 L900,100 L1080,60 L1260,100 L1440,60 L1440,100 L0,100 Z',
  },
];

export const DEFAULT_DIVIDER_SHAPE: DividerShapeId = 'wave_soft';

export const DIVIDER_VIEWBOX = '0 0 1440 100';

export const DIVIDER_MIN_HEIGHT = 40;
export const DIVIDER_MAX_HEIGHT = 160;
export const DIVIDER_DEFAULT_HEIGHT = 80;

/**
 * Devuelve el path de una forma. Si el id guardado en la base no existe
 * (forma eliminada en una versión posterior), cae en la forma por defecto
 * en lugar de romper el render.
 */
export function getDividerPath(id: string | undefined | null): string {
  const found = DIVIDER_SHAPES.find(s => s.id === id);
  if (found) return found.path;
  return DIVIDER_SHAPES.find(s => s.id === DEFAULT_DIVIDER_SHAPE)!.path;
}

/**
 * Clampea la altura al rango permitido. Protege contra valores viejos o
 * corruptos guardados en el JSONB.
 */
export function clampDividerHeight(height: unknown): number {
  const n = typeof height === 'number' ? height : Number(height);
  if (!Number.isFinite(n)) return DIVIDER_DEFAULT_HEIGHT;
  return Math.min(DIVIDER_MAX_HEIGHT, Math.max(DIVIDER_MIN_HEIGHT, Math.round(n)));
}