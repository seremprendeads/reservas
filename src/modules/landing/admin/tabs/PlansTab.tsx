import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { IconSelector } from '../components/IconSelector';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface PlansTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

const NEW_ITEM_DEFAULTS = {
  bg_color: '#fafafa',
  text_color: '#111111',
  button_color: '#059669',
  features: [] as { icon: string; text: string; price?: string }[],
  total: '',
  button_text: 'Reservar',
};

export function PlansTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: PlansTabProps) {
  const p = sections.plans;
  const addItem = () => {
    updateSection('plans', { ...p, items: [...p.items, { name: '', detail: '', ...NEW_ITEM_DEFAULTS }] });
  };
  const removeItem = (i: number) => {
    updateSection('plans', { ...p, items: p.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...p.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('plans', { ...p, items });
  };
  const updateFeatures = (i: number, features: { icon: string; text: string; price?: string }[]) => {
    const items = [...p.items];
    items[i] = { ...items[i], features };
    updateSection('plans', { ...p, items });
  };
  const addFeature = (i: number) => {
    updateFeatures(i, [...(p.items[i].features || []), { icon: 'CheckCircle', text: '', price: '' }]);
  };
  const removeFeature = (i: number, fi: number) => {
    updateFeatures(i, (p.items[i].features || []).filter((_, idx) => idx !== fi));
  };
  const updateFeature = (i: number, fi: number, field: 'icon' | 'text' | 'price', value: string) => {
    const features = [...(p.items[i].features || [])];
    features[fi] = { ...features[fi], [field]: value };
    updateFeatures(i, features);
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={p.title} onChange={e => updateSection('plans', { ...p, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <SectionColorField
        label="Fondo de la sección"
        description="Color de fondo de Planes."
        value={theme.plans_bg_color}
        fallback={DEFAULT_THEME.plans_bg_color}
        onChange={v => updateTheme('plans_bg_color', v)}
      />
      <SectionColorField
        label="Fondo de las tarjetas"
        description="Color por defecto de cada tarjeta. Cada plan puede tener su propio color más abajo."
        value={theme.plans_card_bg_color}
        fallback={DEFAULT_THEME.plans_card_bg_color}
        onChange={v => updateTheme('plans_card_bg_color', v)}
      />
      <p className="text-xs text-muted-foreground">
        Cada plan que agregues acá se muestra como una tarjeta con un botón "Reservar". Al tocarlo, se abre WhatsApp
        (el número que cargaste en Footer) con un mensaje que ya incluye el nombre del plan.
      </p>
      {!sections.footer.whatsapp && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Todavía no cargaste un número de WhatsApp en la pestaña <strong>Footer</strong>. Sin ese número, el botón
          "Reservar" no aparece en ninguna tarjeta de esta sección.
        </div>
      )}
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
          <textarea value={item.detail} onChange={e => updateItem(i, 'detail', e.target.value)} placeholder="Detalle o descripción corta (opcional)" rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />

          <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">Servicios incluidos</p>
                <p className="text-[11px] text-muted-foreground">Cada servicio puede tener su ícono y un precio opcional.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => addFeature(i)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Servicio
              </Button>
            </div>
            {(item.features || []).map((feature, fi) => (
              <div key={fi} className="rounded-lg border bg-background p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <IconSelector value={feature.icon} onChange={v => updateFeature(i, fi, 'icon', v)} />
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive h-9 px-2" onClick={() => removeFeature(i, fi)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Input value={feature.text} onChange={e => updateFeature(i, fi, 'text', e.target.value)}
                  placeholder="Servicio (ej: Corte de cabello)" className="h-10 rounded-xl" />
                <Input value={feature.price || ''} onChange={e => updateFeature(i, fi, 'price', e.target.value)}
                  placeholder="Precio opcional (ej: $5.000)" className="h-10 rounded-xl" />
              </div>
            ))}
            {(item.features || []).length === 0 && (
              <p className="text-[11px] text-muted-foreground">Todavía no agregaste servicios a este plan.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Total del pack</label>
              <Input value={item.total || ''} onChange={e => updateItem(i, 'total', e.target.value)}
                placeholder="Ej: $15.000" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Texto del botón</label>
              <Input value={item.button_text || ''} onChange={e => updateItem(i, 'button_text', e.target.value)}
                placeholder="Reservar" className="h-10 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Fondo de la tarjeta</label>
              <div className="flex items-center gap-2">
                <input type="color" value={item.bg_color || NEW_ITEM_DEFAULTS.bg_color}
                  onChange={e => updateItem(i, 'bg_color', e.target.value)}
                  className="h-9 w-9 shrink-0 rounded-lg border border-input cursor-pointer" />
                <span className="text-xs text-muted-foreground font-mono">{item.bg_color || NEW_ITEM_DEFAULTS.bg_color}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Texto</label>
              <div className="flex items-center gap-2">
                <input type="color" value={item.text_color || NEW_ITEM_DEFAULTS.text_color}
                  onChange={e => updateItem(i, 'text_color', e.target.value)}
                  className="h-9 w-9 shrink-0 rounded-lg border border-input cursor-pointer" />
                <span className="text-xs text-muted-foreground font-mono">{item.text_color || NEW_ITEM_DEFAULTS.text_color}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Botón</label>
              <div className="flex items-center gap-2">
                <input type="color" value={item.button_color || NEW_ITEM_DEFAULTS.button_color}
                  onChange={e => updateItem(i, 'button_color', e.target.value)}
                  className="h-9 w-9 shrink-0 rounded-lg border border-input cursor-pointer" />
                <span className="text-xs text-muted-foreground font-mono">{item.button_color || NEW_ITEM_DEFAULTS.button_color}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar plan
      </Button>
      <SectionBackgroundFields
        imageUrl={p.background_image}
        fixed={p.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="plans_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('plans', { ...p, background_image: url })}
        onFixedChange={v => updateSection('plans', { ...p, background_fixed: v })}
        overlayColor={p.background_overlay_color}
        overlayOpacity={p.background_overlay_opacity}
        onOverlayColorChange={v => updateSection('plans', { ...p, background_overlay_color: v })}
        onOverlayOpacityChange={v => updateSection('plans', { ...p, background_overlay_opacity: v })}
        backgroundPosition={p.background_position}
        onBackgroundPositionChange={v => updateSection('plans', { ...p, background_position: v })}
      />

      <SectionTextStyleFields sectionKey="plans" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
