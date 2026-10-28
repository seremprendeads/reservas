import { useEffect, useRef, useState } from 'react';

/**
 * Devuelve true mientras el usuario hace scroll y lo apaga un rato después de
 * que se detiene. Se escucha en captura para detectar también el scroll del
 * preview del constructor, que ocurre dentro de un contenedor.
 */
export function useScrollPulse(idleMs = 350): boolean {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      setActive(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setActive(false), idleMs);
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [idleMs]);

  return active;
}
