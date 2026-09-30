import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import { supabase } from '../../../../lib/supabase';
import { AVAILABLE_FONTS, DEFAULT_THEME, getGoogleFontsUrl } from '../../config';
import { allThemes } from '../../../../themes';
import type { LandingTheme } from '../../types';

// Carga todas las tipografías disponibles una sola vez, para que el selector
// pueda mostrar cada opción en su letra real (si no, el <select> las muestra
// todas con la fuente del sistema porque nunca se descargaron los archivos).
function useLoadAllFonts() {
  useEffect(() => {
    const url = getGoogleFontsUrl(...AVAILABLE_FONTS.map(f => f.id));
    if (!url) return;
    if (document.querySelector(`link[href="${url}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }, []);
}

interface DesignTabProps {
  theme: LandingTheme; updateTheme: (k: string, v: string) => void; businessId: string;
}

// Igual que la fila de color normal pero con estado "Auto" (vacio), que un
// <input type="color"> no puede representar. Mientras esta en Auto no se emite
// la propiedad CSS y el separador sigue tomando el fondo de la seccion de
// abajo, que es como se comportaba antes de existir este control.
function AutoColorRow({
  label, value, fallback, onChange,
}: {
  label: string; value: string; fallback: string; onChange: (v: string) => void;
}) {
  const isAuto = !value;
  const effective = isAuto ? fallback : value;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-muted-foreground">{label}</label>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={isAuto}
          className="text-[11px] text-primary hover:underline disabled:text-muted-foreground/50 disabled:no-underline disabled:cursor-default"
        >
          Automático
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={effective || '#000000'}
          onChange={e => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded-lg border bg-transparent p-0.5 shrink-0"
        />
        <Input
          type="text"
          value={effective}
          readOnly={isAuto}
          onChange={e => onChange(e.target.value)}
          className={`h-8 font-mono text-xs ${isAuto ? 'opacity-60' : ''}`}
        />
      </div>
      {isAuto && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          Hereda de la sección de abajo ({effective || 'sin color definido'}).
        </p>
      )}
    </div>
  );
}

// Deslizador de espaciado tipografico. Guarda el valor con su unidad CSS
// ("0.05em", "1.6") porque React acepta ambos como string en CSSProperties.
// Vacio = Auto: no se guarda nada y el navegador/Tailwind manda.
function SpacingControl({
  label, value, min, max, step, fallback, unit, sampleFont, onChange,
}: {
  label: string; value: string;
  min: number; max: number; step: number; fallback: number; unit: string;
  sampleFont: string; onChange: (v: string) => void;
}) {
  const parsed = parseFloat(value);
  const current = Number.isFinite(parsed) ? parsed : fallback;
  const display = Math.round(current * 1000) / 1000;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[11px] text-muted-foreground">{label}</label>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {display}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        aria-label={label}
        style={{ fontFamily: `'${sampleFont}', sans-serif`, accentColor: 'hsl(var(--primary))' }}
        onChange={e => {
          const n = Number(e.target.value);
          onChange(`${Math.round(n * 1000) / 1000}${unit}`);
        }}
        className="h-1.5 w-full cursor-pointer"
      />
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

export function DesignTab({ theme, updateTheme, businessId }: DesignTabProps) {
  const [selectedThemeId, setSelectedThemeId] = useState('');
  useLoadAllFonts();

  const applyTheme = (themeId: string) => {
    const t = allThemes.find(th => th.id === themeId);
    if (!t) return;
    setSelectedThemeId(themeId);
    updateTheme('primary_color', t.tokens.primary);
    updateTheme('secondary_color', t.tokens.secondary);
    updateTheme('bg_color', t.tokens.background);
    updateTheme('text_color', t.tokens.text);
    // El footer siempre debe contrastar: en temas claros lo oscurecemos con
    // el color de texto del tema (que es oscuro); en temas oscuros usamos la
    // tarjeta (cardBg), que ya es oscura. Antes usaba siempre cardBg, y en
    // temas claros (ej. Spa) eso dejaba el footer blanco con texto casi
    // blanco encima: invisible.
    const bgIsLight = isLightColor(t.tokens.background);
    updateTheme('footer_bg_color', bgIsLight ? t.tokens.text : t.tokens.cardBg);
    updateTheme('footer_text_color', bgIsLight ? '#f3f4f6' : t.tokens.textMuted);
    updateTheme('social_icon_color', t.tokens.textMuted);
    updateTheme('button_color', t.tokens.primary);
    updateTheme('service_icon_color', t.tokens.primary);
    // Fondos por seccion: alternan entre el fondo base y el de las tarjetas,
    // asi las secciones se distinguen entre si en vez de quedar todas iguales.
    updateTheme('about_bg_color', t.tokens.background);
    updateTheme('main_service_bg_color', t.tokens.cardBg);
    updateTheme('secondary_services_card_bg_color', t.tokens.cardBg);
    updateTheme('why_choose_us_bg_color', t.tokens.background);
    updateTheme('why_choose_us_card_bg_color', t.tokens.cardBg);
    updateTheme('why_choose_us_icon_color', t.tokens.primary);
    updateTheme('gallery_bg_color', t.tokens.cardBg);
    updateTheme('testimonials_bg_color', t.tokens.background);
    updateTheme('testimonials_card_bg_color', t.tokens.cardBg);
    updateTheme('faq_bg_color', t.tokens.cardBg);
    updateTheme('faq_item_bg_color', t.tokens.background);
    updateTheme('map_bg_color', t.tokens.background);
    updateTheme('cta_bg_color', t.tokens.primary);
    updateTheme('plans_bg_color', t.tokens.background);
    updateTheme('plans_card_bg_color', t.tokens.cardBg);
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
            { label: 'Texto', key: 'text_color' },
            { label: 'Botones', key: 'button_color' },
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
        <label className="text-xs font-medium text-foreground mb-2 block">Fondos por sección</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { label: 'Fondo principal', key: 'bg_color' },
            { label: 'Sección Nosotros', key: 'about_bg_color' },
            { label: 'Sección Servicio principal', key: 'main_service_bg_color' },
            { label: 'Cartas de Otros servicios', key: 'secondary_services_card_bg_color' },
            { label: 'Sección Por qué elegirnos', key: 'why_choose_us_bg_color' },
            { label: 'Cartas de Por qué elegirnos', key: 'why_choose_us_card_bg_color' },
            { label: 'Íconos de Por qué elegirnos', key: 'why_choose_us_icon_color' },
            { label: 'Sección Galería', key: 'gallery_bg_color' },
            { label: 'Sección Testimonios', key: 'testimonials_bg_color' },
            { label: 'Cartas de Testimonios', key: 'testimonials_card_bg_color' },
            { label: 'Sección Preguntas frecuentes', key: 'faq_bg_color' },
            { label: 'Cada pregunta y respuesta', key: 'faq_item_bg_color' },
            { label: 'Sección Google Maps', key: 'map_bg_color' },
            { label: 'Sección Reservar ahora (CTA)', key: 'cta_bg_color' },
            { label: 'Sección Planes', key: 'plans_bg_color' },
            { label: 'Cartas de Planes', key: 'plans_card_bg_color' },
            { label: 'Fondo Footer', key: 'footer_bg_color' },
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
        <label className="text-xs font-medium text-foreground mb-2 block">Separadores</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <AutoColorRow
            label="Separador Hero → Nosotros"
            value={theme.divider_hero_about_color}
            fallback={theme.bg_color}
            onChange={v => updateTheme('divider_hero_about_color', v)}
          />
          <AutoColorRow
            label="Separador CTA → Footer"
            value={theme.divider_cta_footer_color}
            fallback={theme.footer_bg_color}
            onChange={v => updateTheme('divider_cta_footer_color', v)}
          />
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
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: `'${f.id}', sans-serif` }}>{f.label}</option>)}
            </select>
            <SpacingControl
              label="Separación de letras"
              value={theme.font_heading_tracking}
              min={-0.1} max={0.5} step={0.005} fallback={0} unit="em"
              sampleFont={theme.font_heading}
              onChange={v => updateTheme('font_heading_tracking', v)}
            />
            <SpacingControl
              label="Altura de renglón"
              value={theme.font_heading_line_height}
              min={0.9} max={2.5} step={0.05} fallback={1.2} unit=""
              sampleFont={theme.font_heading}
              onChange={v => updateTheme('font_heading_line_height', v)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cuerpo</label>
            <select value={theme.font_body} onChange={e => updateTheme('font_body', e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {AVAILABLE_FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: `'${f.id}', sans-serif` }}>{f.label}</option>)}
            </select>
            <SpacingControl
              label="Separación de letras"
              value={theme.font_body_tracking}
              min={-0.1} max={0.5} step={0.005} fallback={0} unit="em"
              sampleFont={theme.font_body}
              onChange={v => updateTheme('font_body_tracking', v)}
            />
            <SpacingControl
              label="Altura de renglón"
              value={theme.font_body_line_height}
              min={0.9} max={2.5} step={0.05} fallback={1.6} unit=""
              sampleFont={theme.font_body}
              onChange={v => updateTheme('font_body_line_height', v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
