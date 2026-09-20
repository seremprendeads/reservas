import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface PlansTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function PlansTab({ sections, updateSection }: PlansTabProps) {
  const p = sections.plans;
  const addItem = () => {
    updateSection('plans', { ...p, items: [...p.items, { name: '', detail: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('plans', { ...p, items: p.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...p.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('plans', { ...p, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={p.title} onChange={e => updateSection('plans', { ...p, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <p className="text-xs text-muted-foreground">
        Cada plan que agregues acá se muestra como una tarjeta con un botón "Consultar". Al tocarlo, se abre WhatsApp
        (el número que cargaste en Footer) con un mensaje que ya incluye el nombre del plan.
      </p>
      <Separator />
      {p.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Plan {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Nombre del plan (ej: Paquete Premium)" className="h-12 rounded-xl" />
          <textarea value={item.detail} onChange={e => updateItem(i, 'detail', e.target.value)} placeholder="Detalle (qué incluye, precio, etc.)" rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar plan
      </Button>
    </div>
  );
}
