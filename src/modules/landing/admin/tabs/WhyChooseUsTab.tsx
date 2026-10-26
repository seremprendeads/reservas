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

interface WhyChooseUsTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function WhyChooseUsTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: WhyChooseUsTabProps) {
  const w = sections.why_choose_us;
  const addItem = () => {
    updateSection('why_choose_us', { ...w, items: [...w.items, { icon: 'CheckCircle', title: '', subtitle: '', text: '' }] });
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
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={w.subtitle || ''} onChange={e => updateSection('why_choose_us', { ...w, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <SectionColorField
        label="Fondo de la sección"
        description="Color de fondo de Por qué elegirnos."
        value={theme.why_choose_us_bg_color}
        fallback={DEFAULT_THEME.why_choose_us_bg_color}
        onChange={v => updateTheme('why_choose_us_bg_color', v)}
      />
      <SectionColorField
        label="Fondo de las tarjetas"
        description="Color de fondo de cada tarjeta de beneficio."
        value={theme.why_choose_us_card_bg_color}
        fallback={DEFAULT_THEME.why_choose_us_card_bg_color}
        onChange={v => updateTheme('why_choose_us_card_bg_color', v)}
      />
      <Separator />
      {w.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Beneficio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <IconSelector value={item.icon} onChange={v => updateItem(i, 'icon', v)} allowEmpty />
          <div>
            <label className="text-xs text-muted-foreground">Título de beneficio</label>
            <Input value={item.title || ''} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Título del beneficio" className="mt-1 h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subtítulo de beneficio</label>
            <Input value={item.subtitle || ''} onChange={e => updateItem(i, 'subtitle', e.target.value)} placeholder="Subtítulo del beneficio" className="mt-1 h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Texto</label>
            <Input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Texto del beneficio" className="mt-1 h-12 rounded-xl" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar beneficio
      </Button>

      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Iconos</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Color y tamaño de los iconos de cada beneficio. En tamaño vacío se usa el que ya tenían.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Color</span>
            <input
              type="color"
              value={theme.why_choose_us_icon_color || '#000000'}
              onChange={e => updateTheme('why_choose_us_icon_color', e.target.value)}
              className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
            />
            <Input
              type="text"
              value={theme.why_choose_us_icon_color || ''}
              onChange={e => updateTheme('why_choose_us_icon_color', e.target.value)}
              className="h-8 w-28 font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Tamaño</span>
            <input
              type="number"
              min={8}
              max={160}
              placeholder="Auto"
              value={theme.why_choose_us_icon_size || ''}
              onChange={e => updateTheme('why_choose_us_icon_size', e.target.value)}
              className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">px</span>
            <button
              type="button"
              onClick={() => updateTheme('why_choose_us_icon_size', '')}
              disabled={!theme.why_choose_us_icon_size}
              className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
            >
              Automático
            </button>
          </div>
        </div>
      </div>

      <SectionBackgroundFields
        imageUrl={w.background_image}
        fixed={w.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="why_choose_us_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('why_choose_us', { ...w, background_image: url })}
        onFixedChange={v => updateSection('why_choose_us', { ...w, background_fixed: v })}
        overlayColor={w.background_overlay_color}
        overlayOpacity={w.background_overlay_opacity}
        onOverlayColorChange={v => updateSection('why_choose_us', { ...w, background_overlay_color: v })}
        onOverlayOpacityChange={v => updateSection('why_choose_us', { ...w, background_overlay_opacity: v })}
      />

      <SectionTextStyleFields sectionKey="why_choose_us" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
