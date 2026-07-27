import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import type { LandingSections } from '../../types';

interface MenuTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function MenuTab({ sections, updateSection }: MenuTabProps) {
  const header = sections.header;
  const menuItems = header.menu_items || [];

  const addItem = () => {
    updateSection('header', { ...header, menu_items: [...menuItems, { label: '', href: '' }] });
  };
  const removeItem = (i: number) => {
    updateSection('header', { ...header, menu_items: menuItems.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...menuItems];
    items[i] = { ...items[i], [field]: value };
    updateSection('header', { ...header, menu_items: items });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Logo</label>
        <Input value={header.logo_title} onChange={e => updateSection('header', { ...header, logo_title: e.target.value })} placeholder="Nombre del logo" className="h-12 rounded-xl" />
        <Input value={header.logo_description} onChange={e => updateSection('header', { ...header, logo_description: e.target.value })} placeholder="Subtítulo del logo" className="h-12 rounded-xl" />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Texto botón CTA del menú</label>
        <Input value={header.cta_text} onChange={e => updateSection('header', { ...header, cta_text: e.target.value })} placeholder="Reservar Turno" className="h-12 rounded-xl" />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Links del menú</label>
        {menuItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Nombre" className="flex-1 h-12 rounded-xl" />
            <Input value={item.href} onChange={e => updateItem(i, 'href', e.target.value)} placeholder="#seccion" className="flex-1 h-12 rounded-xl" />
            <Button variant="ghost" size="sm" className="text-destructive h-10 w-10 px-2 shrink-0" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Agregar link
        </Button>
      </div>
    </div>
  );
}
