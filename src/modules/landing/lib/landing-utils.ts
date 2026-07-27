export interface GalleryImage {
  url: string;
  title: string;
  description: string;
}

export function normalizeImages(imgs: unknown[]): GalleryImage[] {
  return imgs.map(img =>
    typeof img === 'string' ? { url: img, title: '', description: '' } : img
  ) as GalleryImage[];
}
