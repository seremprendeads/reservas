import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { IconSelector } from '../components/IconSelector';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface MainServiceTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function MainServiceTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: MainServiceTabProps) {
  const ms = sections.main_service;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Ícono</label>
        <IconSelector value={ms.icon} onChange={v => updateSection('main_service', { ...ms, icon: v })} allowEmpty />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Apariencia del ícono</label>
        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
          Color y tamaño del ícono de esta sección. En Automático usa el color general
          de iconos de servicios y el tamaño original.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Color</span>
            <input
              type="color"
              value={theme.main_service_icon_color || theme.service_icon_color || '#000000'}
              onChange={e => updateTheme('main_service_icon_color', e.target.value)}
              className="h-7 w-7 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5"
            />
            <Input
              type="text"
              value={theme.main_service_icon_color || ''}
              onChange={e => updateTheme('main_service_icon_color', e.target.value)}
              placeholder="Auto"
              className="h-8 w-28 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => updateTheme('main_service_icon_color', '')}
              disabled={!theme.main_service_icon_color}
              className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
            >
              Automático
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Tamaño</span>
            <input
              type="number"
              min={8}
              max={160}
              placeholder="Auto"
              value={theme.main_service_icon_size || ''}
              onChange={e => updateTheme('main_service_icon_size', e.target.value)}
              className="h-8 w-16 rounded-lg border border-input bg-background px-2 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">px</span>
            <button
              type="button"
              onClick={() => updateTheme('main_service_icon_size', '')}
              disabled={!theme.main_service_icon_size}
              className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
            >
              Automático
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={ms.title} onChange={e => updateSection('main_service', { ...ms, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={ms.subtitle || ''} onChange={e => updateSection('main_service', { ...ms, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción</label>
        <textarea value={ms.description} onChange={e => updateSection('main_service', { ...ms, description: e.target.value })} rows={4}
          className="mt-1.5 w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
      </div>

      <Separator />

      <SectionColorField
        label="Fondo de la sección"
        description="Color de fondo del servicio principal."
        value={theme.main_service_bg_color}
        fallback={DEFAULT_THEME.main_service_bg_color}
        onChange={v => updateTheme('main_service_bg_color', v)}
      />

      <SectionBackgroundFields
        imageUrl={ms.background_image}
        fixed={ms.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="main_service_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('main_service', { ...ms, background_image: url })}
        onFixedChange={v => updateSection('main_service', { ...ms, background_fixed: v })}
      />

      <SectionTextStyleFields sectionKey="main_service" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
