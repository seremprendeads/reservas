import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SECTION_DEFINITIONS } from '../../types';
import { SECTION_ICONS } from '../lib/constants';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import { Sparkles } from 'lucide-react';
import type { LandingTheme } from '../../types';

interface GeneralTabProps {
  slug: string; setSlug: (v: string) => void;
  visibleSections: string[]; toggleVisibleSection: (k: string) => void;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function GeneralTab({ slug, setSlug, visibleSections, toggleVisibleSection, theme, updateTheme }: GeneralTabProps) {
  return (
    <div className="space-y-7">
      <div>
        <label className="text-sm font-medium text-foreground">Slug de la landing</label>
        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="mi-landing" className="mt-1.5 h-12 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1">URL: /{slug || '...'}</p>
      </div>

      <SectionColorField
        label="Fondo principal del sitio"
        description="Fondo base de la página y del header."
        value={theme.bg_color}
        fallback={DEFAULT_THEME.bg_color}
        onChange={v => updateTheme('bg_color', v)}
      />

      <Separator />

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Secciones visibles</label>
        <div className="space-y-3">
          {SECTION_DEFINITIONS.map(s => {
            const Icon = SECTION_ICONS[s.icon] || Sparkles;
            return (
              <label key={s.key} className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
                <input
                  type="checkbox"
                  checked={visibleSections.includes(s.key)}
                  onChange={() => toggleVisibleSection(s.key)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{s.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
