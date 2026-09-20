import { Sparkles, ArrowRight } from 'lucide-react';
import type { ModuleId } from '../types';
import { PLAN_CARDS, PLANS_PAGE_URL, nivelActual } from '../lib/plans';

// ============================================================================
// Invitación a subir de plan, como barra fija arriba del panel.
//
// Se muestra a los negocios que YA contrataron un plan pago menor al completo.
// Ocupa el mismo lugar y la misma altura que la barra del contador de prueba
// (TrialBanner), pero con la paleta suave de las tarjetas de plan en vez del
// naranja y violeta del contador: acá no hay urgencia, hay una oferta.
//
// El catálogo y los enlaces viven en ../lib/plans.ts (fuente única, compartida
// con UpgradePopup).
// ============================================================================

interface UpgradeBannerProps {
  enabledModules: ModuleId[];
}

export function UpgradeBanner({ enabledModules }: UpgradeBannerProps) {
  const level = nivelActual(enabledModules, false, false);
  const options = PLAN_CARDS.filter((p) => p.level > level);
  if (options.length === 0) return null;

  // Se ofrece el escalón inmediato siguiente: es el más probable de contratar.
  const siguiente = options[0];

  return (
    <div
      className="relative shrink-0 overflow-hidden border-b"
      style={{
        background: `linear-gradient(90deg, ${siguiente.bg} 0%, #F3EDFB 100%)`,
        borderColor: siguiente.border,
      }}
    >
      <div className="relative flex h-11 items-center gap-2 px-3 sm:gap-3 lg:px-8">
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: siguiente.button }} />

        <p className="shrink-0 text-[11px] font-bold text-gray-800 sm:text-xs">
          Tu plan<span className="hidden sm:inline"> puede crecer</span>
        </p>

        <span className="hidden truncate text-[11px] text-gray-600 md:inline">
          {siguiente.name}
        </span>

        <a
          href={PLANS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.97] sm:px-4 sm:text-xs"
          style={{ backgroundColor: siguiente.button }}
        >
          <span className="hidden sm:inline">Ver cómo activarlo</span>
          <span className="sm:hidden">Ver</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}