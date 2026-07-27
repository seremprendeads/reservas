import type { LandingSections, LandingTheme } from '../types';
import type { GalleryImage } from '../lib/landing-utils';
import type { TEMPLATE_STYLES } from '../config';

type TemplateStyles = typeof TEMPLATE_STYLES['creative'];

interface GallerySectionProps {
  gallery: LandingSections['gallery'];
  galleryImages: GalleryImage[];
  theme: LandingTheme;
  ts: TemplateStyles;
  headingStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
  onImageClick: (index: number) => void;
}

export function GallerySection({ gallery, galleryImages, theme, ts, headingStyle, bodyStyle, onImageClick }: GallerySectionProps) {
  return (
    <section className={`${ts.sectionSpacing} px-5 sm:px-8 lg:px-12`}>
      <div className="max-w-6xl mx-auto">
        <h2 style={{ ...headingStyle, fontWeight: 700 }} className="text-4xl sm:text-5xl tracking-tight text-center mb-16">
          {gallery.title || 'Galeria'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          {galleryImages.map((img, i) => (
            <button key={i} onClick={() => onImageClick(i)}
              className={`${ts.cardRadius} overflow-hidden aspect-square group cursor-pointer relative bg-black/[0.02]`}>
              <img src={img.url} alt=""
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
              {(img.title || img.description) && (
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                  style={{ backgroundColor: `${gallery.overlay_color || theme.text_color}dd` }}>
                  <div className="p-4 text-center sm:text-left">
                    {img.title && (
                      <p style={{ ...headingStyle, color: '#ffffff', fontWeight: 500 }} className="text-sm leading-tight">
                        {img.title}
                      </p>
                    )}
                    {img.description && (
                      <p style={{ ...bodyStyle, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }} className="text-sm leading-snug mt-1">
                        {img.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
