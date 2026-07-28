import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { supabase } from '../../../../lib/supabase';
import { AVAILABLE_FONTS, DEFAULT_THEME } from '../../config';
import { allThemes } from '../../../../themes';
import type { LandingTheme } from '../../types';

interface DesignTabProps {
  theme: LandingTheme; updateTheme: (k: string, v: string) => void; businessId: string;
}

export function DesignTab({ theme, updateTheme, businessId }: DesignTabProps) {
  const [selectedThemeId, setSelectedThemeId] = useState('');

  const applyTheme = (themeId: string) => {
    const t = allThemes.find(th => th.id === themeId);
    if (!t) return;
    setSelectedThemeId(themeId);
    updateTheme('primary_color', t.tokens.primary);
    updateTheme('bg_color', t.tokens.background);
    updateTheme('text_color', t.tokens.text);
    updateTheme('footer_bg_color', t.tokens.cardBg);
    updateTheme('social_icon_color', t.tokens.textMuted);
    updateTheme('button_color', t.tokens.primary);
    updateTheme('service_icon_color', t.tokens.primary);
  };

  const copyFromBranding = async () => {
    if (!businessId) return;
    const { data } = await supabase.from('branding').select('*').eq('business_id', businessId).maybeSingle();
    if (!data) return;
    setSelectedThemeId('');
    updateTheme('primary_color', data.primary_color || DEFAULT_THEME.primary_color);
    updateTheme('bg_color', data.background_color || DEFAULT_THEME.bg_color);
    updateTheme('text_color', data.text_color || DEFAULT_THEME.text_color);
    updateTheme('footer_bg_color', data.card_bg_color || DEFAULT_THEME.footer_bg_color);
    updateTheme('social_icon_color', data.muted_color || DEFAULT_THEME.social_icon_color);
    updateTheme('button_color', data.primary_color || DEFAULT_THEME.button_color);
    updateTheme('service_icon_color', data.primary_color || DEFAULT_THEME.service_icon_color);
  };

  const resetToDefaults = () => {
    setSelectedThemeId('');
    (Object.entries(DEFAULT_THEME) as [string, string][]).forEach(([k, v]) => updateTheme(k, v));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyFromBranding}>Copiar paleta de Apariencia</Button>
        <Button variant="outline" size="sm" onClick={resetToDefaults} title="Restaurar valores predeterminados"><RotateCcw className="w-4 h-4" /></Button>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground mb-2 block">Temas predefinidos</label>
        <div className="grid grid-cols-3 gap-1.5">
          {allThemes.map(t => (
            <button key={t.id} onClick={() => applyTheme(t.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg border p-1.5 transition-all ${
                selectedThemeId === t.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
              }`}>
              <div className="flex gap-0.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.tokens.primary }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.tokens.background }} />
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.tokens.cardBg }} />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground truncate leading-none">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-foreground mb-2 block">Colores</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            <div key={c.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{c.label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-7 w-7 cursor-pointer rounded-lg border bg-transparent p-0.5 shrink-0" />
                <Input type="text" value={theme[c.key as keyof LandingTheme] as string}
                  onChange={e => updateTheme(c.key, e.target.value)}
                  className="h-8 font-mono text-xs" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-xs font-medium text-foreground mb-2 block">Bordes de Botones</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-muted-foreground">Forma de bordes</label>
            <select value={theme.button_border_radius} onChange={e => updateTheme('button_border_radius', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
        <label className="text-xs font-medium text-foreground mb-2 block">Tipografía</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-muted-foreground">Títulos</label>
            <select value={theme.font_heading} onChange={e => updateTheme('font_heading', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cuerpo</label>
            <select value={theme.font_body} onChange={e => updateTheme('font_body', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
