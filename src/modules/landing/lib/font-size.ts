/**
 * Convierte un tamaño guardado en el theme (px como string) al valor que espera
 * React en `fontSize`. Devuelve `undefined` (= tamaño automático) si está
 * vacío o no es un número válido.
 */
export function fontSize(value?: string): string | undefined {
  const n = parseFloat(value || '');
  return Number.isFinite(n) ? `${n}px` : undefined;
}
