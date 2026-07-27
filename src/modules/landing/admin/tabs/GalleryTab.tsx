import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Separator } from '../../../../components/ui/separator';
import { normalizeImages } from '../../lib/landing-utils';
import type { LandingSections } from '../../types';

interface GalleryTabProps {
  sections: LandingSections; updateSection: (k: string, v: unknown) => void;
  triggerUpload: (t: string) => void; uploadingImage: string | null;
}

export function GalleryTab({ sections, updateSection, triggerUpload, uploadingImage }: GalleryTabProps) {
  const g = sections.gallery;
  const maxImages = 6;

  const removeImage = (i: number) => {
    const normalized = normalizeImages(g.images);
    const newImages = normalized.filter((_, idx) => idx !== i);
    updateSection('gallery', { ...g, images: newImages });
  };

  const updateImage = (i: number, field: string, value: string) => {
    const normalized = normalizeImages(g.images);
    const newImages = [...normalized];
    newImages[i] = { ...newImages[i], [field]: value };
    updateSection('gallery', { ...g, images: newImages });
  };

  const normalizedImages = normalizeImages(g.images);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Título de sección</label>
        <Input value={g.title} onChange={e => updateSection('gallery', { ...g, title: e.target.value })} className="mt-1.5 h-12 rounded-xl" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Color de fondo hover</label>
        <div className="flex items-center gap-2.5 mt-1.5">
          <input type="color" value={g.overlay_color || '#111827'}
            onChange={e => updateSection('gallery', { ...g, overlay_color: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded-xl border bg-transparent p-0.5 shrink-0" />
          <Input type="text" value={g.overlay_color || '#111827'}
            onChange={e => updateSection('gallery', { ...g, overlay_color: e.target.value })}
            className="h-9 font-mono text-xs" />
        </div>
      </div>
      <Separator />
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Imágenes ({normalizedImages.length}/{maxImages})
        </label>
        <div className="space-y-4">
          {normalizedImages.map((img, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,.05)]">
              <div className="flex items-start gap-4">
                <img src={img.url} alt="" className="w-20 h-20 rounded-xl object-cover border shrink-0" />
                <div className="flex-1 space-y-3">
                  <Input value={img.title} onChange={e => updateImage(i, 'title', e.target.value)}
                    placeholder="Título (hover)" className="h-10 rounded-xl text-xs" />
                  <Input value={img.description} onChange={e => updateImage(i, 'description', e.target.value)}
                    placeholder="Descripción (hover)" className="h-10 rounded-xl text-xs" />
                </div>
                <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0 shrink-0" onClick={() => removeImage(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {normalizedImages.length < maxImages && (
            <button
              onClick={() => triggerUpload(`gallery_${normalizedImages.length}`)}
              disabled={!!uploadingImage}
              className="w-full h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-all duration-200"
            >
              {uploadingImage?.startsWith('gallery_') ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5 mb-1" />
                  <span className="text-xs">Agregar imagen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
