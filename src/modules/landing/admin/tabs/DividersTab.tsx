import { FlipHorizontal } from 'lucide-react';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections, LandingDivider, LandingTheme } from '../../types';
import { DEFAULT_SECTIONS } from '../../config';
import {
  DIVIDER_SHAPES,
  DIVIDER_VIEWBOX,
  DIVIDER_MIN_HEIGHT,
  DIVIDER_MAX_HEIGHT,
  clampDividerHeight,
} from '../../lib/dividers';

interface DividersTabProps {
  sections: LandingSections;
  updateSection: (k: string, v: unknown) => void;
  theme?: LandingTheme;
}

type DividerKey = 'hero_about' | 'cta_footer';

// Color efectivo de cada separador: el elegido en Diseño, o el fondo de la
// seccion de abajo cuando esta en Automatico.
const DIVIDER_FALLBACK: Record<DividerKey, (t: LandingTheme) => string> = {
  hero_about: t => t.about_bg_color,
  cta_footer: t => t.footer_bg_color,
};
const DIVIDER_COLOR_KEY: Record<DividerKey, keyof LandingTheme> = {
  hero_about: 'divider_hero_about_color',
  cta_footer: 'divider_cta_footer_color',
};

const DIVIDER_BLOCKS: { key: DividerKey; label: string; help: string }[] = [
  { key: 'hero_about', label: 'Hero → Nosotros', help: 'Se dibuja al final del hero. El fondo del hero (color o imagen) se ve por detrás de la curva.' },
  { key: 'cta_footer', label: 'CTA → Footer', help: 'Se dibuja al final de la sección de llamada a la acción, antes del footer.' },
];

export function DividersTab({ sections, updateSection, theme }: DividersTabProps) {
  const d = sections.dividers ?? DEFAULT_SECTIONS.dividers;
  const hasDivider = d.hero_about.enabled || d.cta_footer.enabled;
  const parallaxActive = d.parallax !== false && !hasDivider;

  const patch = (key: DividerKey, changes: Partial<LandingDivider>) => {
    updateSection('dividers', {
      ...d,
      // Parallax y separadores son excluyentes: al activar un separador se
      // apaga el fondo fijo.
      ...(changes.enabled ? { parallax: false } : {}),
      [key]: { ...d[key], ...changes },
    });
  };

  const toggleParallax = () => {
    if (parallaxActive) {
      updateSection('dividers', { ...d, parallax: false });
      return;
    }
    // Al activar parallax se desactivan los dos separadores.
    updateSection('dividers', {
      ...d,
      parallax: true,
      hero_about: { ...d.hero_about, enabled: false },
      cta_footer: { ...d.cta_footer, enabled: false },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Acá elegís la forma y la altura de las curvas. El color se define en la tab Diseño
        (bloque Separadores): si lo dejás en Automático, el separador toma el fondo de la
        sección de abajo, así que cambia solo con la paleta.
      </p>

      <div className="space-y-2">
        <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
          <input
            type="checkbox"
            checked={parallaxActive}
            onChange={toggleParallax}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">
            Fondo de imágenes fijo (efecto parallax)
          </span>
        </label>
        <p className="text-xs text-amber-600 leading-relaxed">
          El parallax y los separadores no se pueden usar juntos. Si activǭs el parallax,
          se desactivan los separadores; y si activǭs un separador, se desactiva el parallax.
          Elegí uno de los dos efectos.
        </p>
      </div>

      {DIVIDER_BLOCKS.map(({ key, label, help }, i) => {
        const cfg = d[key] ?? DEFAULT_SECTIONS.dividers[key];
        const height = clampDividerHeight(cfg.height);
        const custom = theme ? (theme[DIVIDER_COLOR_KEY[key]] as string) || '' : '';
        const previewColor = (custom || (theme ? DIVIDER_FALLBACK[key](theme) : '')) || '#ffffff';

        return (
          <div key={key} className="space-y-4">
            {i > 0 && <Separator />}

            <label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-muted/40 transition-all duration-200">
              <input
                type="checkbox"
                checked={cfg.enabled}
                onChange={() => patch(key, { enabled: !cfg.enabled })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </label>

            {cfg.enabled && (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">{help}</p>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Forma</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIVIDER_SHAPES.map(shape => {
                      const active = cfg.shape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => patch(key, { shape: shape.id })}
                          className={`rounded-xl border p-2 transition-all duration-200 ${
                            active
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-input hover:bg-muted/40'
                          }`}
                        >
                          <svg
                            viewBox={DIVIDER_VIEWBOX}
                            preserveAspectRatio="none"
                            focusable="false"
                            className="block w-full h-8 rounded-md bg-muted"
                            style={{ transform: cfg.flip ? 'scaleX(-1)' : undefined }}
                          >
                            <path d={shape.path} fill={previewColor} />
                          </svg>
                          <span className="mt-1.5 block text-[11px] text-muted-foreground">
                            {shape.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">
                    Altura: {height}px
                  </label>
                  <input
                    type="range"
                    min={DIVIDER_MIN_HEIGHT}
                    max={DIVIDER_MAX_HEIGHT}
                    value={height}
                    onChange={e => patch(key, { height: Number(e.target.value) })}
                    className="w-full mt-1"
                  />
                  {height > 100 && (
                    <p className="text-xs text-amber-600 mt-1.5 leading-relaxed">
                      Con alturas grandes el separador puede superponerse a los botones en
                      pantallas chicas. Revisá la vista previa en mobile.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer hover:bg-muted/40 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={cfg.flip}
                    onChange={() => patch(key, { flip: !cfg.flip })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <FlipHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Invertir horizontalmente</span>
                </label>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}