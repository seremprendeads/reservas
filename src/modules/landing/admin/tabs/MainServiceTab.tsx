import { Input } from '../../../../components/ui/input';
import { IconSelector } from '../components/IconSelector';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import type { LandingSections, LandingTheme } from '../../types';

interface MainServiceTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function MainServiceTab({ sections, updateSection, theme, updateTheme }: MainServiceTabProps) {
  const ms = sections.main_service;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Ícono</label>
        <IconSelector value={ms.icon} onChange={v => updateSection('main_service', { ...ms, icon: v })} allowEmpty />
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

      <SectionTextStyleFields sectionKey="main_service" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
