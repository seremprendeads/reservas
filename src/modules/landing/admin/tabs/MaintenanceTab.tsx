import { Construction, Wrench, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { SectionColorField } from '../components/SectionColorField';
import { DEFAULT_SECTIONS } from '../../config';
import type { LandingSections } from '../../types';

interface MaintenanceTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function MaintenanceTab({ sections, updateSection, triggerUpload, uploadingImage }: MaintenanceTabProps) {
  const m = sections.maintenance ?? DEFAULT_SECTIONS.maintenance;
  const update = (patch: Partial<LandingSections['maintenance']>) => updateSection('maintenance', { ...m, ...patch });

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
        <input
          type="checkbox"
          checked={m.enabled}
          onChange={() => update({ enabled: !m.enabled })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">Activar página en construcción / mantenimiento</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            Mientras esté activa, los visitantes verán esta pantalla en lugar de tu sitio. Vos seguís viendo el constructor y la vista previa normalmente.
          </span>
        </span>
      </label>

      {m.enabled && (
        <>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Modo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update({ mode: 'maintenance' })}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                  m.mode === 'maintenance' ? 'border-primary bg-primary/10 text-primary font-medium' : 'hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <Wrench className="h-4 w-4" /> Mantenimiento
              </button>
              <button
                type="button"
                onClick={() => update({ mode: 'construction' })}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                  m.mode === 'construction' ? 'border-primary bg-primary/10 text-primary font-medium' : 'hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <Construction className="h-4 w-4" /> En construcción
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-foreground">Título</label>
            <Input value={m.title} onChange={e => update({ title: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Estamos trabajando en nuestro sitio" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Mensaje</label>
            <textarea
              value={m.message}
              onChange={e => update({ message: e.target.value })}
              rows={4}
              placeholder="Muy pronto vas a poder ver nuestra nueva web..."
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Texto extra</label>
            <Input value={m.extra_text} onChange={e => update({ extra_text: e.target.value })} className="mt-1.5 h-12 rounded-xl" placeholder="Ej: Volvemos el lunes 10" />
            <p className="text-xs text-muted-foreground mt-1">Opcional. Se muestra debajo del mensaje.</p>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => triggerUpload('maintenance_image')} disabled={!!uploadingImage}>
                {uploadingImage === 'maintenance_image' ? 'Subiendo...' : m.image_url ? 'Cambiar' : 'Subir imagen'}
              </Button>
              {m.image_url && (
                <>
                  <img src={m.image_url} alt="" className="h-16 w-32 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => update({ image_url: null })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <SectionColorField
            label="Color de fondo"
            value={m.bg_color}
            fallback={DEFAULT_SECTIONS.maintenance.bg_color}
            onChange={v => update({ bg_color: v })}
          />
          <SectionColorField
            label="Color del texto"
            value={m.text_color}
            fallback={DEFAULT_SECTIONS.maintenance.text_color}
            onChange={v => update({ text_color: v })}
          />
          <SectionColorField
            label="Color de acento"
            value={m.accent_color}
            fallback={DEFAULT_SECTIONS.maintenance.accent_color}
            onChange={v => update({ accent_color: v })}
          />

          <Separator />

          <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
            <input
              type="checkbox"
              checked={m.show_contact}
              onChange={() => update({ show_contact: !m.show_contact })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">Mostrar datos de contacto del footer (WhatsApp y email)</span>
          </label>

          <p className="text-xs text-muted-foreground">
            Recordá guardar los cambios para publicar la página.
          </p>
        </>
      )}
    </div>
  );
}
