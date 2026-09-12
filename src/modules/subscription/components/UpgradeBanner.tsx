import type { ModuleId } from '../types';
import { PLAN_CARDS, linkDePlan, nivelActual } from '../lib/plans';

// ============================================================================
// Invitación a subir de plan, fija en el panel.
//
// Se muestra a los negocios que YA contrataron un plan pago menor al completo.
// Ofrece solo los planes superiores al que tienen. El catálogo y los enlaces
// viven en ../lib/plans.ts (fuente única, compartida con UpgradePopup).
// ============================================================================

interface UpgradeBannerProps {
  enabledModules: ModuleId[];
}

export function UpgradeBanner({ enabledModules }: UpgradeBannerProps) {
  const level = nivelActual(enabledModules, false, false);
  const options = PLAN_CARDS.filter((p) => p.level > level);
  if (options.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-lg text-foreground">Tu plan puede crecer</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Elegí la opción que mejor te sirva y te contamos cómo activarla.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((p) => (
          <a
            key={p.key}
            href={linkDePlan(p)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ backgroundColor: p.bg, borderColor: p.border }}
          >
            <p className="text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">{p.detail}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
