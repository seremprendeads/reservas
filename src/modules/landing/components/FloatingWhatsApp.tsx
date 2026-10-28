import { useEffect, useRef, useState } from 'react';
import whatsappIcon from '../../../../imagenes/WhatsApp_icon.png';

type FloatingWhatsAppProps = {
  phone: string;
};

export function FloatingWhatsApp({ phone }: FloatingWhatsAppProps) {
  const [scrolling, setScrolling] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setScrolling(false), 350);
    };
    // En el preview del admin el scroll ocurre dentro de un contenedor, por eso
    // se escucha en captura sobre window.
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!phone) return null;

  const clean = phone.replace(/[\s\-\(\)\+]/g, '');
  const href = clean.startsWith('54') ? `https://wa.me/${clean}` : `https://wa.me/54${clean}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40"
      aria-label="Contactar por WhatsApp"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-full bg-[#25D366] ${scrolling ? 'animate-whatsapp-pulse motion-reduce:animate-none' : 'opacity-0'}`}
      />
      <img
        src={whatsappIcon}
        alt="WhatsApp"
        className="relative z-10 h-7 w-7"
      />
    </a>
  );
}
