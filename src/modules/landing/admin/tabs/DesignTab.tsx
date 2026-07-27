import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { AVAILABLE_FONTS } from '../../config';
import type { LandingTheme } from '../../types';

interface DesignTabProps {
  theme: LandingTheme; updateTheme: (k: string, v: string) => void;
}

export function DesignTab({ theme, updateTheme }: DesignTabProps) {
  return (
    <div className="space-y-7">
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Colores</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: 'Principal', key: 'primary_color' },
            { label: 'Secundario', key: 'secondary_color' },
            { label: 'Fondo', key: 'bg_color' },
            { label: 'Texto', key: 'text_color' },
            { label: 'Botones', key: 'button_color' },
            { label: 'Fondo Footer', key: 'footer_bg_color' },
            { label: 'Texto Footer', key: 'footer_text_color' },
            { label: 'Iconos Redes', key: 'social_icon_color' },
            { label: 'Iconos Servicios', key: 'service_icon_color' },
          ].map(c => (
            <div key={c.key} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{c.label}</label>
              <div className="flex items-center gap-2.5">
                <input type="color" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
                <Input type="text" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-9 font-mono text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Bordes de Botones</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-foreground">Forma de bordes</label>
            <select value={theme.button_border_radius} onChange={e => updateTheme('button_border_radius', e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="rounded-none">Cuadrado</option>
              <option value="rounded-sm">Redondeado chico</option>
              <option value="rounded">Redondeado</option>
              <option value="rounded-md">Medio</option>
              <option value="rounded-lg">Grande</option>
              <option value="rounded-xl">Extra grande</option>
              <option value="rounded-2xl">Muy redondeado</option>
              <option value="rounded-3xl">Ultra redondeado</option>
              <option value="rounded-full">Pill / totally redondo</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">Tipografía</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-foreground">Títulos</label>
            <select value={theme.font_heading} onChange={e => updateTheme('font_heading', e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cuerpo</label>
            <select value={theme.font_body} onChange={e => updateTheme('font_body', e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
