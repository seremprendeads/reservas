import { useEffect, useRef } from 'react';

interface ParallaxImageProps {
  imageUrl?: string;
  enabled?: boolean;
  strength?: number;
  className?: string;
  /** Capa de color sobre la imagen (solo si hay imagen). Opacidad 0–100. */
  overlayColor?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export function ParallaxImage({ imageUrl, enabled = true, strength = 0.55, className = '', overlayColor, overlayOpacity, children }: ParallaxImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const layer = layerRef.current;
    if (!wrapper || !layer) return;

    if (!enabled) {
      layer.style.transform = 'none';
      return;
    }

    const scroller = wrapper.closest<HTMLElement>('[data-preview-container]');

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      const centerY = scroller
        ? scroller.getBoundingClientRect().top + scroller.getBoundingClientRect().height / 2
        : window.innerHeight / 2;
      const delta = rect.top + rect.height / 2 - centerY;
      // La capa mide 156% de alto (28% extra arriba y abajo) + el zoom, asi
      // que un desplazamiento de hasta el 25% de la seccion nunca deja ver
      // los bordes del fondo.
      const limit = rect.height * 0.25;
      const offset = Math.max(-limit, Math.min(limit, -delta * strength));
      layer.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
    };

    update();
    // En el preview el scroll ocurre dentro de un contenedor, no en la
    // ventana; el listener en captura sobre window atrapa tambien esos
    // eventos sin depender de encontrar el contenedor exacto.
    const target: HTMLElement | Window = scroller ?? window;
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update);
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [enabled, strength, imageUrl]);

  return (
    <div ref={wrapperRef} className={`absolute inset-0 overflow-hidden ${children ? '' : 'pointer-events-none'} ${className}`}>
      <div
        ref={layerRef}
        className="absolute -inset-y-[28%] inset-x-0 bg-cover bg-center will-change-transform"
        style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}
      />
      {imageUrl && overlayOpacity ? (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ backgroundColor: overlayColor || '#000000', opacity: overlayOpacity / 100 }} />
      ) : null}
      {children}
    </div>
  );
}
