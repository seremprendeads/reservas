import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '../lib/landing-utils';

interface LightboxProps {
  galleryImages: GalleryImage[];
  lightboxIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ galleryImages, lightboxIndex, onClose, onPrev, onNext }: LightboxProps) {
  if (lightboxIndex < 0 || lightboxIndex >= galleryImages.length) return null;
  const currentImage = galleryImages[lightboxIndex];
  if (!currentImage?.url) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.90)' }}
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-150 backdrop-blur-sm">
        <X className="h-6 w-6" />
      </button>
      {galleryImages.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Imagen anterior"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 hover:bg-black/70 active:scale-95 transition-all duration-150">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Imagen siguiente"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white shadow-lg ring-1 ring-white/20 hover:bg-black/70 active:scale-95 transition-all duration-150">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <img src={currentImage.url} alt=""
        className="relative z-0 max-w-[88vw] max-h-[80vh] sm:max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()} />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
        {lightboxIndex + 1} / {galleryImages.length}
      </div>
    </div>
  );
}
