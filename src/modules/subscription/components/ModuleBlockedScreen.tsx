import type { ModuleId } from '../types';
import { Lock } from 'lucide-react';

interface ModuleBlockedScreenProps {
  moduleId: ModuleId;
  supportUrl?: string;
}

const MODULE_MESSAGES: Record<ModuleId, { title: string; description: string }> = {
  bio: {
    title: 'Bio no disponible',
    description: 'Este módulo no está disponible en tu plan actual.',
  },
  landing: {
    title: 'Este sitio se encuentra temporalmente deshabilitado.',
    description: 'Renová tu membresía para volver a activar tu Landing Page.',
  },
  reservas: {
    title: 'Este negocio tiene las reservas deshabilitadas.',
    description: 'Renová tu membresía para volver a aceptar reservas.',
  },
  shop: {
    title: 'La tienda no se encuentra disponible.',
    description: 'Renová tu membresía para volver a activar tu tienda.',
  },
  seo: {
    title: 'SEO no disponible',
    description: 'Renová tu membresía para activar el posicionamiento SEO.',
  },
  landing_shop: {
    title: 'Landing de tienda no disponible',
    description: 'Renová tu membresía para activar la landing de tu tienda.',
  },
};

export function ModuleBlockedScreen({ moduleId, supportUrl }: ModuleBlockedScreenProps) {
  const msg = MODULE_MESSAGES[moduleId];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,.05)] transition-all duration-200 dark:bg-gray-900 dark:shadow-[0_8px_30px_rgba(0,0,0,.2)]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
            <Lock className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="mb-3 text-center text-xl font-semibold text-gray-900 dark:text-gray-100">
          {msg.title}
        </h2>
        <p className="mb-8 text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {msg.description}
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={supportUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
          >
            Renovar membresía
          </a>
        </div>
      </div>
    </div>
  );
}
