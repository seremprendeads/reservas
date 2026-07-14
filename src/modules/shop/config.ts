export const PLAN_LIMITS = {
  products: 20,
};

export const IMAGE_CONFIG = {
  product: { maxWidth: 600, maxHeight: 600, quality: 0.7, format: 'image/webp' as const },
  thumbnail: { width: 200, height: 200, quality: 0.6, format: 'image/webp' as const },
};

export const SHOP_STORAGE_BUCKET = 'shop-images';
