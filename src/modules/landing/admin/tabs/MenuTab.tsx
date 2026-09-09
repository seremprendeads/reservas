import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import type { LandingSections } from '../../types';

interface MenuTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function MenuTab({ sections, updateSection, triggerUpload, uploadingImage }: MenuTabProps) {
  const header = sections.header;
  const menuItems = header.menu_items || [];
  const logoImage = header.logo_image_url || '';

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
  const removeLogoImage = () => {
    updateSection('header', { ...header, logo_image_url: null });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Logo perfil del nav</label>
        <div className="flex items-center gap-4">
          {logoImage ? (
            <img src={logoImage} alt="Logo del nav" className="h-14 w-14 rounded-full object-cover border" />
          ) : (
            <div className="h-14 w-14 rounded-full border border-dashed bg-muted/30" />
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => triggerUpload('header_logo')}
              disabled={!!uploadingImage}
              className="inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 border border-input bg-background hover:bg-muted/40 hover:text-accent-foreground h-11 px-4 py-2"
            >
              {uploadingImage === 'header_logo' ? 'Subiendo...' : logoImage ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {logoImage && (
              <button
                onClick={removeLogoImage}
                className="text-xs text-destructive hover:underline text-left px-1"
              >
                Quitar logo del nav
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Si no cargás una imagen acá, el nav usa el logo general de Configuración → General.
        </p>
      </div>

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