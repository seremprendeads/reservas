export const PLAN_LIMITS = {
  products: 20,
};

export const IMAGE_CONFIG = {
  product: { maxWidth: 800, maxHeight: 800, quality: 0.8, format: 'image/webp' as const },
  thumbnail: { width: 300, height: 300, quality: 0.8, format: 'image/webp' as const },
};

export const SHOP_STORAGE_BUCKET = 'shop-images';
