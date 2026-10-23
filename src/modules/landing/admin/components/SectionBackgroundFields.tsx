import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import type { LandingSections } from '../../types';

interface SectionBackgroundFieldsProps {
  imageUrl?: string | null;
  fixed?: boolean;
  dividers: LandingSections['dividers'];
  updateSection: (k: string, v: unknown) => void;
  onImageChange?: (url: string | null) => void;
  onChange?: (url: string | null) => void;
  onFixedChange: (fixed: boolean) => void;
  triggerUpload?: (t: string) => void;
  uploadingImage?: string | null;
  uploadTarget?: string;
  hideUpload?: boolean;
  recommended?: string;
}

export function SectionBackgroundFields({
  imageUrl,
  fixed,
  dividers,
  updateSection,
  onImageChange,
  onChange,
  onFixedChange,
  triggerUpload,
  uploadingImage,
  uploadTarget,
  hideUpload = false,
  recommended = '1920 × 1080 px (horizontal). JPG o WebP, idealmente menos de 500 KB.',
}: SectionBackgroundFieldsProps) {
  const setImage = onImageChange || onChange;
  const dividersEnabled = dividers.hero_about.enabled || dividers.cta_footer.enabled;
  const effectiveFixed = (fixed ?? (dividers.parallax !== false)) && !dividersEnabled;

  const handleToggleFixed = () => {
    const next = !effectiveFixed;
    if (next) {
      updateSection('dividers', {
        ...dividers,
        parallax: true,
        hero_about: { ...dividers.hero_about, enabled: false },
        cta_footer: { ...dividers.cta_footer, enabled: false },
      });
    }
    onFixedChange(next);
  };

  return (
    <>
      {!hideUpload && (
        <>
          <Separator />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Imagen de fondo</label>
            <div className="mb-3 rounded-xl border bg-muted/20 p-3 text-[11px] leading-relaxed text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Medida recomendada:</span> {recommended}</p>
              <p>La imagen se recorta para cubrir toda la sección: dejá el motivo principal centrado.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => uploadTarget && triggerUpload?.(uploadTarget)}
                disabled={!!uploadingImage || !uploadTarget}
              >
                {uploadingImage === uploadTarget ? 'Subiendo...' : imageUrl ? 'Cambiar' : 'Subir imagen'}
              </Button>
              {imageUrl && (
                <>
                  <img src={imageUrl} alt="" className="h-16 w-32 rounded-xl object-cover border" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setImage?.(null)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {imageUrl && (
        <div className="rounded-xl border bg-muted/20 p-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveFixed}
              onChange={handleToggleFixed}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium text-foreground">Fondo fijo (efecto parallax)</span>
          </label>
          <p className="mt-2 pl-7 text-[11px] leading-relaxed text-muted-foreground">
            El fondo fijo y los separadores no se pueden usar juntos. Al activarlo, los separadores se desactivan automáticamente.
          </p>
        </div>
      )}
    </>
  );
}
