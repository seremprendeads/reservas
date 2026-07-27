import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { IconSelector } from '../components/IconSelector';
import type { LandingSections } from '../../types';

interface WhyChooseUsTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function WhyChooseUsTab({ sections, updateSection }: WhyChooseUsTabProps) {
  const w = sections.why_choose_us;
  const addItem = () => {
    updateSection('why_choose_us', { ...w, items: [...w.items, { icon: 'CheckCircle', text: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('why_choose_us', { ...w, items: w.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...w.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('why_choose_us', { ...w, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={w.title} onChange={e => updateSection('why_choose_us', { ...w, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <Separator />
      {w.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Beneficio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <IconSelector value={item.icon} onChange={v => updateItem(i, 'icon', v)} />
          <Input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Texto del beneficio" className="h-12 rounded-xl" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar beneficio
      </Button>
    </div>
  );
}
