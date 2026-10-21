import type { CSSProperties } from 'react';
import type { LandingTheme } from '../types';

const TRANSFORMS = new Set(['uppercase', 'lowercase', 'capitalize']);

/**
 * Peso, cursiva y mayúsculas/minúsculas de un texto del theme.
 *
 * Se guardan en claves derivadas de la clave base (`about_title_weight`,
 * `about_title_italic`, `about_title_transform`). Vacío = automático: no se
 * emite la propiedad y el estilo de la sección sigue mandando.
 */
export function textStyleExtras(theme: LandingTheme, baseKey: string): CSSProperties {
  const weight = theme[`${baseKey}_weight`];
  const italic = theme[`${baseKey}_italic`];
  const transform = theme[`${baseKey}_transform`];

  return {
    ...(weight ? { fontWeight: weight } : {}),
    ...(italic === 'italic' ? { fontStyle: 'italic' as const } : {}),
    ...(transform && TRANSFORMS.has(transform)
      ? { textTransform: transform as CSSProperties['textTransform'] }
      : {}),
  };
}
