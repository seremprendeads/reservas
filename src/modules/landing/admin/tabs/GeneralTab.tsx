import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SECTION_DEFINITIONS } from '../../types';
import { SECTION_ICONS } from '../lib/constants';
import { Sparkles } from 'lucide-react';
import type { LandingSections } from '../../types';

interface GeneralTabProps {
  slug: string; setSlug: (v: string) => void;
  template: string; setTemplate: (v: string) => void;
  visibleSections: string[]; toggleVisibleSection: (k: string) => void;
  logoUrl: string; triggerUpload: (t: string) => void; uploadingImage: string | null;
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function GeneralTab({ slug, setSlug, template, setTemplate, visibleSections, toggleVisibleSection, logoUrl, triggerUpload, uploadingImage, sections, updateSection }: GeneralTabProps) {
  return (
    <div className="space-y-7">
      <div>
        <label className="text-sm font-medium text-foreground">Slug de la landing</label>
        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="mi-landing" className="mt-1.5 h-12 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1">URL: /{slug || '...'}</p>
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Logo</label>
        <div className="flex items-center gap-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover border" />}
          <button
            onClick={() => triggerUpload('logo')}
            disabled={!!uploadingImage}
            className="inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 border border-input bg-background hover:bg-muted/40 hover:text-accent-foreground h-12 px-4 py-2"
          >
            {uploadingImage === 'logo' ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Título del logo (Header)</label>
        <Input value={sections.header.logo_title} onChange={e => updateSection('header', { ...sections.header, logo_title: e.target.value })} placeholder="Nombre del negocio" className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción del logo (Header)</label>
        <Input value={sections.header.logo_description} onChange={e => updateSection('header', { ...sections.header, logo_description: e.target.value })} placeholder="Subtítulo o descripción" className="mt-1.5 h-12 rounded-xl" />
      </div>

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
