import { MessageCircle } from 'lucide-react';

type FloatingWhatsAppProps = {
  phone: string;
};

export function FloatingWhatsApp({ phone }: FloatingWhatsAppProps) {
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
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
