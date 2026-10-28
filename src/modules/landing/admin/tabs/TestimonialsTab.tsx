import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SectionTextStyleFields } from '../components/SectionTextStyleFields';
import { SectionBackgroundFields } from '../components/SectionBackgroundFields';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_THEME } from '../../config';
import type { LandingSections, LandingTheme } from '../../types';

interface TestimonialsTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function TestimonialsTab({ sections, updateSection, triggerUpload, uploadingImage, theme, updateTheme }: TestimonialsTabProps) {
  const t = sections.testimonials;
  const addItem = () => {
    updateSection('testimonials', { ...t, items: [...t.items, { name: '', text: '', rating: 5, image_url: null }] });
  };
  const removeItem = (i: number) => {
    updateSection('testimonials', { ...t, items: t.items.filter((_, idx) => idx !== i) });
  };
  const updateItem = (i: number, field: string, value: unknown) => {
    const items = [...t.items];
    items[i] = { ...items[i], [field]: value };
    updateSection('testimonials', { ...t, items });
  };
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={t.title} onChange={e => updateSection('testimonials', { ...t, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Subtítulo</label>
        <Input value={t.subtitle || ''} onChange={e => updateSection('testimonials', { ...t, subtitle: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Frase corta que acompaña al título" />
      </div>
      <SectionColorField
        label="Fondo de la sección"
        description="Color de fondo de Testimonios."
        value={theme.testimonials_bg_color}
        fallback={DEFAULT_THEME.testimonials_bg_color}
        onChange={v => updateTheme('testimonials_bg_color', v)}
      />
      <SectionColorField
        label="Fondo de las tarjetas"
        description="Color de fondo de cada testimonio."
        value={theme.testimonials_card_bg_color}
        fallback={DEFAULT_THEME.testimonials_card_bg_color}
        onChange={v => updateTheme('testimonials_card_bg_color', v)}
      />
      <SectionColorField
        label="Color de las estrellas"
        description="Estrellas que corresponden a la calificación."
        value={theme.testimonials_star_color}
        fallback={DEFAULT_THEME.testimonials_star_color}
        onChange={v => updateTheme('testimonials_star_color', v)}
      />
      <SectionColorField
        label="Color de estrellas vacías"
        description="Estrellas restantes de la calificación."
        value={theme.testimonials_star_empty_color}
        fallback={DEFAULT_THEME.testimonials_star_empty_color}
        onChange={v => updateTheme('testimonials_star_empty_color', v)}
      />
      <SectionColorField
        label="Color de fondo del avatar (sin foto)"
        description="Si elegís un color, reemplaza el degradado. Vacío = degradado de abajo."
        value={theme.testimonials_avatar_bg_color}
        fallback=""
        onChange={v => updateTheme('testimonials_avatar_bg_color', v)}
      />
      <SectionColorField
        label="Avatar sin foto: degradado desde"
        description="Primer color del degradado. Vacío = color principal del tema."
        value={theme.testimonials_avatar_gradient_from}
        fallback={theme.primary_color}
        onChange={v => updateTheme('testimonials_avatar_gradient_from', v)}
      />
      <SectionColorField
        label="Avatar sin foto: degradado hasta"
        description="Segundo color del degradado. Vacío = color secundario del tema."
        value={theme.testimonials_avatar_gradient_to}
        fallback={theme.secondary_color}
        onChange={v => updateTheme('testimonials_avatar_gradient_to', v)}
      />
      <SectionColorField
        label="Color de la inicial"
        description="Letra que se muestra dentro del círculo cuando no hay foto."
        value={theme.testimonials_avatar_text_color}
        fallback={DEFAULT_THEME.testimonials_avatar_text_color}
        onChange={v => updateTheme('testimonials_avatar_text_color', v)}
      />
      <div>
        <label className="text-sm font-medium text-foreground">Link a reseñas de Google (opcional)</label>
        <Input value={t.google_review_url || ''} onChange={e => updateSection('testimonials', { ...t, google_review_url: e.target.value || null })}
          placeholder="https://g.page/r/..."
          className="mt-1.5 h-12 rounded-xl" />
        <p className="text-xs text-muted-foreground mt-1.5">
          Si lo completás, aparece un botón debajo de los testimonios invitando a dejar una reseña en Google.
        </p>
      </div>
      <Separator />
      {t.items.map((item, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Testimonio {i + 1}</span>
            <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeItem(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Nombre del cliente" className="h-12 rounded-xl" />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Foto de perfil (opcional)</label>
            <div className="mb-2 rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Medida recomendada:</span> 400 × 400 px (cuadrada). JPG o WebP.</p>
              <p>Se comprime automáticamente al subirla. Si no subís foto, se muestra la inicial con los colores de arriba.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => triggerUpload(`testimonial_image_${i}`)} disabled={!!uploadingImage}>
                {uploadingImage === `testimonial_image_${i}` ? 'Subiendo...' : item.image_url ? 'Cambiar' : 'Subir foto'}
              </Button>
              {item.image_url && (
                <>
                  <img src={item.image_url} alt="" className="h-12 w-12 rounded-full object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateItem(i, 'image_url', null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <textarea value={item.text} onChange={e => updateItem(i, 'text', e.target.value)} placeholder="Testimonio" rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200" />
          <div>
            <label className="text-sm font-medium text-foreground">Calificación</label>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => updateItem(i, 'rating', star)}
                  className={`text-lg ${star <= item.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Agregar testimonio
      </Button>

      <SectionBackgroundFields
        imageUrl={t.background_image}
        fixed={t.background_fixed}
        dividers={sections.dividers}
        updateSection={updateSection}
        uploadTarget="testimonials_background"
        triggerUpload={triggerUpload}
        uploadingImage={uploadingImage}
        onChange={url => updateSection('testimonials', { ...t, background_image: url })}
        onFixedChange={v => updateSection('testimonials', { ...t, background_fixed: v })}
        overlayColor={t.background_overlay_color}
        overlayOpacity={t.background_overlay_opacity}
        onOverlayColorChange={v => updateSection('testimonials', { ...t, background_overlay_color: v })}
        onOverlayOpacityChange={v => updateSection('testimonials', { ...t, background_overlay_opacity: v })}
        backgroundPosition={t.background_position}
        onBackgroundPositionChange={v => updateSection('testimonials', { ...t, background_position: v })}
      />

      <SectionTextStyleFields sectionKey="testimonials" theme={theme} updateTheme={updateTheme} />
    </div>
  );
}
