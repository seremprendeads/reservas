import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface FaqTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function FaqTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: FaqTabProps) {
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
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={f.subtitle || ''} onChange={e => updateSection('faq', { ...f, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <SectionColorField
        label="Fondo de la sección"
        description="Color de fondo de Preguntas frecuentes."
        value={theme.faq_bg_color}
        fallback={DEFAULT_THEME.faq_bg_color}
        onChange={v => updateTheme('faq_bg_color', v)}
      />
      <SectionColorField
        label="Fondo de cada pregunta y respuesta"
        description="Color de fondo de cada ítem del acordeón."
        value={theme.faq_item_bg_color}
        fallback={DEFAULT_THEME.faq_item_bg_color}
        onChange={v => updateTheme('faq_item_bg_color', v)}
      />
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

      <SectionBackgroundFields
        imageUrl={f.background_image}
        fixed={f.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="faq_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('faq', { ...f, background_image: url })}
        onFixedChange={v => updateSection('faq', { ...f, background_fixed: v })}
        overlayColor={f.background_overlay_color}
        overlayOpacity={f.background_overlay_opacity}
        onOverlayColorChange={v => updateSection('faq', { ...f, background_overlay_color: v })}
        onOverlayOpacityChange={v => updateSection('faq', { ...f, background_overlay_opacity: v })}
      />

      <SectionTextStyleFields sectionKey="faq" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
