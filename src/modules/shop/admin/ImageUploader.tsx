import { useState, useRef, useCallback } from 'react';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SHOP_STORAGE_BUCKET, IMAGE_CONFIG } from '../config';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

type UploadStatus = 'idle' | 'selected' | 'compressing' | 'uploading' | 'saving' | 'done' | 'error';

interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onOldImageDelete?: (oldUrl: string) => void;
  disabled?: boolean;
}

const statusMessages: Record<UploadStatus, string> = {
  idle: '',
  selected: 'Imagen seleccionada',
  compressing: 'Optimizando imagen...',
  uploading: 'Subiendo al servidor...',
  saving: 'Guardando producto...',
  done: 'Producto creado correctamente',
  error: 'No se pudo subir la imagen. Intentá nuevamente.',
};

const statusIcons: Record<UploadStatus, string> = {
  idle: '',
  selected: '📷',
  compressing: '🗜️',
  uploading: '☁️',
  saving: '💾',
  done: '✅',
  error: '❌',
};

function compressImageForProduct(file: File): Promise<Blob> {
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
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Compresión fallida')),
        fmt,
        quality
      );
    };
    img.onerror = () => reject(new Error('Error al leer imagen'));
    img.src = url;
  });
}

function uploadWithProgress(
  bucket: string,
  fileName: string,
  blob: Blob,
  onProgress: (pct: number) => void
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/storage/v1/upload/${bucket}/${fileName}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Error de red al subir imagen'));
    xhr.send(blob);
  });
}

export function ImageUploader({
  currentImageUrl,
  onUploadComplete,
  onOldImageDelete,
  disabled,
}: ImageUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setPreview(URL.createObjectURL(file));
    setStatus('selected');
    setProgress(0);
    setErrorMessage('');

    // Compress
    setStatus('compressing');
    let blob: Blob;
    try {
      blob = await compressImageForProduct(file);
    } catch {
      setStatus('error');
      setErrorMessage('Error al procesar la imagen.');
      return;
    }

    // Upload
    setStatus('uploading');
    setProgress(0);
    const fileName = `product-${Date.now()}.webp`;
    try {
      await uploadWithProgress(SHOP_STORAGE_BUCKET, fileName, blob, setProgress);
    } catch {
      setStatus('error');
      setErrorMessage('No se pudo subir la imagen. Verificá tu conexión e intentá nuevamente.');
      return;
    }

    // Get public URL
    setStatus('saving');
    const { data: urlData } = supabase.storage
      .from(SHOP_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    const publicUrl = (urlData?.publicUrl || '') + `?t=${Date.now()}`;

    // Delete old image if replacing
    if (currentImageUrl && onOldImageDelete) {
      onOldImageDelete(currentImageUrl);
    }

    setPreview(publicUrl);
    setStatus('done');
    setProgress(100);
    onUploadComplete(publicUrl);
  }, [currentImageUrl, onUploadComplete, onOldImageDelete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    if (currentImageUrl && onOldImageDelete) {
      onOldImageDelete(currentImageUrl);
    }
    onUploadComplete('');
  };

  const isActive = status === 'compressing' || status === 'uploading' || status === 'saving';

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {preview && status !== 'idle' ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full h-28 object-cover rounded-lg border"
          />
          {!isActive && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Cambiar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click o arrastrá una imagen
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            WebP, JPG o PNG
          </p>
        </div>
      )}

      {isActive && (
    <div className="space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="text-muted-foreground">
              {statusIcons[status]} {statusMessages[status]}
            </span>
            {status === 'uploading' && (
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                {progress}%
              </span>
            )}
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          ✅ Imagen subida correctamente
        </p>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}


