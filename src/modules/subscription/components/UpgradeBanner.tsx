import { Sparkles } from 'lucide-react';
import type { ModuleId } from '../types';

// Módulos que se pueden sumar, en el orden de la escalera de planes.
const UPGRADABLE: { id: ModuleId; label: string; pitch: string }[] = [
  { id: 'reservas', label: 'Reservas', pitch: 'Tomá turnos online, con agenda y recordatorios.' },
  { id: 'landing', label: 'Sitio web', pitch: 'Tu página completa, con servicios, galería y contacto.' },
  { id: 'shop', label: 'Mini tienda', pitch: 'Vendé productos y cobrá online.' },
];

interface UpgradeBannerProps {
  enabledModules: ModuleId[];
  supportUrl?: string;
}

// Invitación a sumar módulos. Solo se muestra en planes pagos a los que
// les falta algo; en Todo completo no aparece.
export function UpgradeBanner({ enabledModules, supportUrl }: UpgradeBannerProps) {
  const missing = UPGRADABLE.filter((m) => !enabledModules.includes(m.id));
  if (missing.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Tu plan puede crecer</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {missing.length === 1
              ? 'Todavía podés sumar una función más a tu cuenta.'
              : `Todavía podés sumar ${missing.length} funciones a tu cuenta.`}
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {missing.map((m) => (
              <li key={m.id} className="rounded-xl bg-secondary/60 px-4 py-3">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{m.pitch}</p>
              </li>
            ))}
          </ul>
        </div>

        {supportUrl && (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90"
          >
            Quiero sumarlo
          </a>
        )}
      </div>
    </div>
  );
}
