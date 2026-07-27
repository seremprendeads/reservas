import { Input } from '../../../../components/ui/input';
import { IconSelector } from '../components/IconSelector';
import type { LandingSections } from '../../types';

interface MainServiceTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function MainServiceTab({ sections, updateSection }: MainServiceTabProps) {
  const ms = sections.main_service;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Ícono</label>
        <IconSelector value={ms.icon} onChange={v => updateSection('main_service', { ...ms, icon: v })} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={ms.title} onChange={e => updateSection('main_service', { ...ms, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción</label>
        <textarea value={ms.description} onChange={e => updateSection('main_service', { ...ms, description: e.target.value })} rows={4}
          className="mt-1.5 w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
      </div>
    </div>
  );
}
