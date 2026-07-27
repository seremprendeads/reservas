import { AlertTriangle } from 'lucide-react';

interface FreePlanBannerProps {
  supportUrl?: string;
}

export function FreePlanBanner({ supportUrl }: FreePlanBannerProps) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/30 dark:bg-amber-900/10">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold text-amber-800 dark:text-amber-200">
            Tu período de prueba finalizó.
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-amber-700 dark:text-amber-300">
            Actualmente estás utilizando el Plan Gratuito.
            <br />
            Actualizá tu membresía para volver a activar:
          </p>
          <ul className="mb-4 ml-1 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>• Landing</li>
            <li>• Reservas</li>
            <li>• Shop</li>
            <li>• SEO</li>
          </ul>
          {supportUrl && (
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-amber-700"
            >
              Renovar membresía
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
