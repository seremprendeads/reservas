import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import type { LandingSections, LandingTheme } from '../../types';

interface AboutTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function AboutTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: AboutTabProps) {
  const a = sections.about;
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título</label>
        <Input value={a.title} onChange={e => updateSection('about', { ...a, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={a.subtitle || ''} onChange={e => updateSection('about', { ...a, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Descripción</label>
        <textarea value={a.description} onChange={e => updateSection('about', { ...a, description: e.target.value })} rows={4}
          className="mt-1.5 w-full h-24 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Alineación</label>
        <select value={a.alignment || 'left'} onChange={e => updateSection('about', { ...a, alignment: e.target.value })}
          className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
          <option value="justify">Justificado</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Imagen</label>
        <div className="mb-3 rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1">
          <p><span className="font-medium text-foreground">Medida recomendada:</span> 1200 × 800 px (horizontal, proporción 3:2).</p>
          <p><span className="font-medium text-foreground">Para pantallas de alta resolución:</span> 1600 × 1067 px.</p>
          <p>En celular la imagen se recorta casi cuadrada: dejá el sujeto principal centrado y evitá detalles importantes en los bordes.</p>
          <p>Formato JPG o WebP, idealmente de menos de 500 KB para que la web cargue rápido.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => triggerUpload('about_image')} disabled={!!uploadingImage}>
            {uploadingImage === 'about_image' ? 'Subiendo...' : a.image_url ? 'Cambiar' : 'Subir imagen'}
          </Button>
          {a.image_url && (
            <>
              <img src={a.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateSection('about', { ...a, image_url: null })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {a.image_url && (
        <div>
          <label className="text-sm font-medium text-foreground">Posición de la imagen</label>
          <select value={a.image_position || 'left'} onChange={e => updateSection('about', { ...a, image_position: e.target.value })}
            className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="left">Izquierda</option>
            <option value="right">Derecha</option>
          </select>
        </div>
      )}

      <SectionBackgroundFields
        imageUrl={a.background_image}
        fixed={a.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="about_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('about', { ...a, background_image: url })}
        onFixedChange={v => updateSection('about', { ...a, background_fixed: v })}
      />

      <SectionTextStyleFields sectionKey="about" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
