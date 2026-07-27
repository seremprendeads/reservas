import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { IconSelector } from '../components/IconSelector';
import type { LandingSections } from '../../types';

interface ServicesTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function ServicesTab({ sections, updateSection }: ServicesTabProps) {
  const ss = sections.secondary_services;
  const addItem = () => {
    updateSection('secondary_services', {
      ...ss,
      items: [...ss.items, { icon: 'Wrench', title: '', description: '' }],
    });
  };
  const removeItem = (i: number) => {
    updateSection('secondary_services', {
      ...ss,
      items: ss.items.filter((_, idx) => idx !== i),
    });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...ss.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('secondary_services', { ...ss, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={ss.title} onChange={e => updateSection('secondary_services', { ...ss, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <Separator />
      {ss.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Servicio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <IconSelector value={item.icon} onChange={v => updateItem(i, 'icon', v)} />
          <Input value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Título" className="h-12 rounded-xl" />
          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Descripción" className="h-12 rounded-xl" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar servicio
      </Button>
    </div>
  );
}
