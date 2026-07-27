import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface FaqTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function FaqTab({ sections, updateSection }: FaqTabProps) {
  const f = sections.faq;
  const addItem = () => {
    updateSection('faq', { ...f, items: [...f.items, { question: '', answer: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('faq', { ...f, items: f.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('faq', { ...f, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={f.title} onChange={e => updateSection('faq', { ...f, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <Separator />
      {f.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">FAQ {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.question} onChange={e => updateItem(i, 'question', e.target.value)} placeholder="Pregunta" className="h-12 rounded-xl" />
          <textarea value={item.answer} onChange={e => updateItem(i, 'answer', e.target.value)} placeholder="Respuesta" rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar FAQ
      </Button>
    </div>
  );
}
