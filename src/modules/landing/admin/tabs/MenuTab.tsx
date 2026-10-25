import { Plus, Trash2, Circle, Square } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { ButtonStyleFields } from '../components/ButtonStyleFields';
import { Separator } from '../../../../components/ui/separator';
import { cn } from '../../../../lib/utils';
import type { LandingSections, LandingTheme } from '../../types';

interface MenuTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
  logoUrl: string; triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function MenuTab({ sections, updateSection, theme, updateTheme, logoUrl, triggerUpload, uploadingImage }: MenuTabProps) {
  const header = sections.header;
  const menuItems = header.menu_items || [];
  const logoSize = header.logo_size || 100;
  const setHeader = (patch: Partial<LandingSections['header']>) => updateSection('header', { ...header, ...patch });

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
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className={cn(
                'border bg-muted/20',
                header.logo_shape === 'square'
                  ? 'h-12 w-auto max-w-[140px] object-contain rounded-lg p-1'
                  : 'h-12 w-12 object-cover rounded-full'
              )}
            />
          )}
          <button
            type="button"
            onClick={() => triggerUpload('logo')}
            disabled={!!uploadingImage}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 border border-input bg-background hover:bg-muted/40 hover:text-accent-foreground h-12 px-4 py-2"
          >
            {uploadingImage === 'logo' ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </button>
          <div className="flex items-center gap-1 rounded-xl border p-1">
            <button
              type="button"
              title="Círculo"
              onClick={() => setHeader({ logo_shape: 'circle' })}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                (header.logo_shape || 'circle') === 'circle' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40'
              )}
            >
              <Circle className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Cuadrado"
              onClick={() => setHeader({ logo_shape: 'square' })}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
                header.logo_shape === 'square' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40'
              )}
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="logo-size" className="text-sm font-medium text-foreground">Tamaño del logo</label>
          <span className="text-sm text-muted-foreground tabular-nums">{logoSize}%</span>
        </div>
        <input
          id="logo-size"
          type="range"
          min={60}
          max={140}
          step={5}
          value={logoSize}
          onChange={e => setHeader({ logo_size: Number(e.target.value) })}
          className="mt-3 w-full cursor-pointer accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Más chico</span>
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => setHeader({ logo_size: 100 })}>Restablecer</button>
          <span>Más grande</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Título del logo (Header)</label>
        <Input value={header.logo_title} onChange={e => setHeader({ logo_title: e.target.value })} placeholder="Nombre del negocio" className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción del logo (Header)</label>
        <Input value={header.logo_description} onChange={e => setHeader({ logo_description: e.target.value })} placeholder="Subtítulo o descripción" className="mt-1.5 h-12 rounded-xl" />
      </div>

      <Separator />

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

      <SectionTextStyleFields sectionKey="header" theme={theme} updateTheme={updateTheme} />
      <ButtonStyleFields baseKey="header_cta" label="Botón de contacto / Reservar" theme={theme} updateTheme={updateTheme} defaultBg={theme.button_color} />
    </div>
  );
}