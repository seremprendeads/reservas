import { useState, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useBusiness } from '../../../contexts/BusinessContext';
import { SHOP_STORAGE_BUCKET, IMAGE_CONFIG } from '../config';
import { Progress } from '../../../components/ui/progress';
import { deleteStorageFile } from './storage-utils';

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

function compressImage(file: File): Promise<Blob> {
  const { maxWidth, maxHeight, quality, format } = IMAGE_CONFIG.product;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
      if (h > maxHeight) { w = w * maxHeight / h; h = maxHeight; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const fmt = canvas.toDataURL(format).startsWith(`data:${format}`) ? format : 'image/jpeg';
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compresión fallida')), fmt, quality);
    };
    img.onerror = () => reject(new Error('Error al leer imagen'));
    img.src = url;
  });
}

export function MultiImageUploader({ images, onImagesChange, maxImages = 4, disabled }: MultiImageUploaderProps) {
  const { business } = useBusiness();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingIndexRef = useRef<number>(0);

  const uploadFile = useCallback(async (file: File, targetIndex: number) => {
    if (!file.type.startsWith('image/')) return;

    setUploadingIndex(targetIndex);
    setStatus('compressing');
    setProgress(0);

    let blob: Blob;
    try {
      blob = await compressImage(file);
    } catch {
      setStatus('error');
      setUploadingIndex(null);
      return;
    }

    setStatus('uploading');
    setProgress(0);
    const businessId = business?.id || 'default';
    const fileName = `${businessId}/product-gallery-${Date.now()}-${targetIndex}.webp`;
    try {
      const { error } = await supabase.storage.from(SHOP_STORAGE_BUCKET).upload(fileName, blob, { contentType: 'image/webp', upsert: false });
      if (error) throw new Error(error.message);
      setProgress(100);
    } catch {
      setStatus('error');
      setUploadingIndex(null);
      return;
    }

    const { data: urlData } = supabase.storage.from(SHOP_STORAGE_BUCKET).getPublicUrl(fileName);
    const publicUrl = (urlData?.publicUrl || '') + `?t=${Date.now()}`;

    const updated = [...images];
    updated[targetIndex] = publicUrl;
    onImagesChange(updated);
    setStatus('done');
    setUploadingIndex(null);
  }, [images, onImagesChange, business?.id]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, pendingIndexRef.current);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, index);
  };

  const handleRemove = (index: number) => {
    if (images[index]) {
      deleteStorageFile(images[index], SHOP_STORAGE_BUCKET);
    }
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const triggerUpload = (index: number) => {
    pendingIndexRef.current = index;
    inputRef.current?.click();
  };

  const slotsCount = Math.max(images.length + 1, 1);

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: Math.min(slotsCount, maxImages) }).map((_, i) => (
          <div
            key={i}
            onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={e => handleDrop(e, i)}
            className="relative group"
          >
            {images[i] ? (
              <>
                <img src={images[i]} alt={`Imagen ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                  <button type="button" onClick={() => triggerUpload(i)} disabled={disabled || uploadingIndex !== null}
                    className="px-2 py-1 rounded text-xs font-medium bg-white/90 text-black hover:bg-white transition-colors disabled:opacity-50">
                    Cambiar
                  </button>
                  <button type="button" onClick={() => handleRemove(i)} disabled={disabled || uploadingIndex !== null}
                    className="p-1 rounded bg-red-500/90 text-white hover:bg-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {uploadingIndex === i && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-1">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <Progress value={progress} className="h-1 w-16" />
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => triggerUpload(i)}
                disabled={disabled || uploadingIndex !== null}
                className={`w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${dragOverIndex === i ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'} disabled:opacity-50`}
              >
                <Plus className="w-5 h-5 text-muted-foreground mb-0.5" />
                <span className="text-[10px] text-muted-foreground">Foto {i + 1}</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {status === 'error' && <p className="text-xs text-red-600">Error al procesar imagen. Intentá nuevamente.</p>}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">{images.length}/{maxImages} imágenes adicionales</p>
      )}
    </div>
  );
}
