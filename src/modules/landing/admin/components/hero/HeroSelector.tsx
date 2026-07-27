import { Layout, ImageIcon, Video } from 'lucide-react';
import type { HeroTemplate } from '../../../sections/hero/types';
import { HERO_TEMPLATE_LABELS, HERO_TEMPLATE_DESCRIPTIONS } from '../../../sections/hero/types';

interface HeroSelectorProps {
  value: HeroTemplate;
  onChange: (template: HeroTemplate) => void;
}

const TEMPLATE_ICONS: Record<HeroTemplate, typeof Layout> = {
  centered: Layout,
  image: ImageIcon,
  video: Video,
};

export function HeroSelector({ value, onChange }: HeroSelectorProps) {
  return (
    <div className="space-y-5">
      <label className="text-sm font-medium text-foreground">Plantilla Hero</label>
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(HERO_TEMPLATE_LABELS) as HeroTemplate[]).map(template => {
          const Icon = TEMPLATE_ICONS[template];
          const isActive = value === template;
          return (
            <button
              key={template}
              onClick={() => onChange(template)}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                isActive
                  ? 'border-primary bg-primary/5 text-primary shadow-[0_8px_30px_rgba(0,0,0,.05)]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40 text-muted-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              <div>
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                  {HERO_TEMPLATE_LABELS[template]}
                </p>
                <p className="text-xs text-muted-foreground">{HERO_TEMPLATE_DESCRIPTIONS[template]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
