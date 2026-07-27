import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface TestimonialsTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function TestimonialsTab({ sections, updateSection }: TestimonialsTabProps) {
  const t = sections.testimonials;
  const addItem = () => {
    updateSection('testimonials', { ...t, items: [...t.items, { name: '', text: '', rating: 5 }] });
  };
  const removeItem = (i: number) => {
    updateSection('testimonials', { ...t, items: t.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: unknown) => {
    const items = [...t.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('testimonials', { ...t, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={t.title} onChange={e => updateSection('testimonials', { ...t, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <Separator />
      {t.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Testimonio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Nombre del cliente" className="h-12 rounded-xl" />
          <textarea value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Testimonio" rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
          <div>
            <label className="text-sm font-medium text-foreground">Calificación</label>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => updateItem(i, 'rating', star)}
                  className={`text-lg ${star <= item.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar testimonio
      </Button>
    </div>
  );
}
