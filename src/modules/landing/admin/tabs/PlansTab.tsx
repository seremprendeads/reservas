import { Input } from '../../../../components/ui/input';
import { PLAN_CARDS } from '../../../subscription/lib/plans';
import type { LandingSections } from '../../types';

interface PlansTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function PlansTab({ sections, updateSection }: PlansTabProps) {
  const p = sections.plans;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={p.title} onChange={e => updateSection('plans', { ...p, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div className="rounded-xl border p-4 space-y-2 bg-muted/30">
        <p className="text-sm font-medium text-foreground">Planes que se muestran</p>
        <p className="text-xs text-muted-foreground">
          El listado y los precios de los planes se manejan desde un solo lugar (el catálogo comercial), no acá.
          Al tocar "Contratar" en cualquiera, se abre WhatsApp con el nombre del plan ya escrito en el mensaje.
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5 pt-1">
          {PLAN_CARDS.map(plan => <li key={plan.key}>{plan.name}</li>)}
        </ul>
      </div>
    </div>
  );
}
