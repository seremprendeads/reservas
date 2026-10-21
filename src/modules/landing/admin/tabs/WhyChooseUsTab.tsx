import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { IconSelector } from '../components/IconSelector';
import { ColorRow } from '../components/SectionColorFields';
import type { LandingSections, LandingTheme } from '../../types';

interface WhyChooseUsTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function WhyChooseUsTab({ sections, updateSection, theme, updateTheme }: WhyChooseUsTabProps) {
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
  const colorFallback = theme.text_color || '#111111';
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
        <label className="text-xs font-medium text-foreground mb-1 block">Colores de la sección</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Cambian solo esta sección. En Automático se usa el color que ya tenía.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <ColorRow
            label="Título principal"
            hint="El encabezado de la sección."
            value={theme.why_choose_us_title_color || ''}
            fallback={colorFallback}
            onChange={v => updateTheme('why_choose_us_title_color', v)}
          />
          <ColorRow
            label="Subtítulo"
            hint="La línea de entrada, debajo del título."
            value={theme.why_choose_us_subtitle_color || ''}
            fallback={colorFallback}
            onChange={v => updateTheme('why_choose_us_subtitle_color', v)}
          />
          <ColorRow
            label="Texto"
            hint="Las descripciones y textos de los beneficios."
            value={theme.why_choose_us_text_color || ''}
            fallback={colorFallback}
            onChange={v => updateTheme('why_choose_us_text_color', v)}
          />
        </div>
      </div>

      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Colores de los beneficios</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Solo los títulos. En Automático heredan del título principal de la sección.
        </p>
        <ColorRow
          label="Título de beneficios"
          hint="Los títulos de cada beneficio."
          value={theme.why_choose_us_item_title_color || ''}
          fallback={theme.why_choose_us_title_color || colorFallback}
          onChange={v => updateTheme('why_choose_us_item_title_color', v)}
        />
      </div>

      <Separator />
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Tamaños de letra</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          En píxeles. Dejá vacío para usar el tamaño automático.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { label: 'Título principal', key: 'why_choose_us_title_size', placeholder: '36' },
            { label: 'Subtítulos', key: 'why_choose_us_subtitle_size', placeholder: '18' },
            { label: 'Títulos de beneficios', key: 'why_choose_us_item_title_size', placeholder: '18' },
            { label: 'Textos', key: 'why_choose_us_text_size', placeholder: '14' },
          ].map(s => (
            <div key={s.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{s.label}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={8}
                  max={120}
                  step={1}
                  value={(theme[s.key as keyof LandingTheme] as string) || ''}
                  placeholder={`Auto (${s.placeholder})`}
                  onChange={e => updateTheme(s.key, e.target.value)}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
