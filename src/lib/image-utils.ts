interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

export function compressImage(file: File, opts: CompressOptions): Promise<Blob> {
  const { maxWidth, maxHeight, quality = 0.85 } = opts;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
      if (h > maxHeight) { w = w * maxHeight / h; h = maxHeight; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const fmt = canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compresión fallida')), fmt, quality);
    };
    img.onerror = () => reject(new Error('Error al leer imagen'));
    img.src = url;
  });
}
