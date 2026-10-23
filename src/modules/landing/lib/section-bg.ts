import type { CSSProperties } from 'react';

/**
 * Estilo de fondo para secciones que no usan el parallax animado.
 * Si el fondo es fijo, la imagen la pinta <SectionBackground /> y acá solo
 * se devuelve el color base.
 */
export function sectionBackgroundStyle(
  imageUrl: string | null | undefined,
  fixed: boolean,
): CSSProperties | null {
  if (!imageUrl || fixed) return null;
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}
