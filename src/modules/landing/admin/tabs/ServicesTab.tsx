import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface ServicesTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function ServicesTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: ServicesTabProps) {
  const ss = sections.secondary_services;
  const addItem = () => {
    updateSection('secondary_services', {
      ...ss,
      items: [...ss.items, { icon: 'Wrench', image_url: null, title: '', description: '' }],
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
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={ss.subtitle || ''} onChange={e => updateSection('secondary_services', { ...ss, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Fondo de las tarjetas</label>
        <p className="text-xs text-muted-foreground mb-2">Color de fondo de cada tarjeta de servicio.</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.secondary_services_card_bg_color || '#ffffff'}
            onChange={e => updateTheme('secondary_services_card_bg_color', e.target.value)}
            className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
          />
          <Input
            type="text"
            value={theme.secondary_services_card_bg_color || ''}
            onChange={e => updateTheme('secondary_services_card_bg_color', e.target.value)}
            className="h-9 w-32 font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => updateTheme('secondary_services_card_bg_color', DEFAULT_THEME.secondary_services_card_bg_color)}
            className="text-[11px] text-primary hover:underline"
          >
            Restablecer
          </button>
        </div>
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
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Imagen</label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => triggerUpload(`secondary_service_${i}`)} disabled={!!uploadingImage}>
                {uploadingImage === `secondary_service_${i}` ? 'Subiendo...' : item.image_url ? 'Cambiar' : 'Subir imagen'}
              </Button>
              {item.image_url && (
                <>
                  <img src={item.image_url} alt="" className="h-14 w-14 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateItem(i, 'image_url', '')}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <Input value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Título" className="h-12 rounded-xl" />
          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Descripción" className="h-12 rounded-xl" />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar servicio
      </Button>

      <SectionTextStyleFields sectionKey="secondary_services" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
