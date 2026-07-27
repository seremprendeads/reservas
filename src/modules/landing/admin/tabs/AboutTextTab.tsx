import { Input } from '../../../../components/ui/input';
import type { LandingSections } from '../../types';

interface AboutTextTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
}

export function AboutTextTab({ sections, updateSection }: AboutTextTabProps) {
  const at = sections.about_text || { title: '', text: '', alignment: 'left' };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={at.title} onChange={e => updateSection('about_text', { ...at, title: e.target.value })}
          placeholder="Título del bloque de texto..."
          className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Texto</label>
        <textarea value={at.text} onChange={e => updateSection('about_text', { ...at, text: e.target.value })} rows={6}
          placeholder="Escribí el contenido de este bloque..."
          className="mt-1.5 w-full h-32 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Alineación</label>
        <select value={at.alignment || 'left'} onChange={e => updateSection('about_text', { ...at, alignment: e.target.value })}
          className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
          <option value="justify">Justificado</option>
        </select>
      </div>
    </div>
  );
}
