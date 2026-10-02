import { useState, useCallback, useRef } from 'react';
import { uploadStorageFile } from '../lib/storage-upload';

interface UseImageUploadOptions {
  bucket: string;
  filePrefix: string;
  maxFileSize?: number;
  acceptedTypes?: string[];
  compress?: (file: File) => Promise<Blob>;
}

// No hay opcion de carpeta a proposito: uploadStorageFile antepone siempre el
// business_id de la sesion. Antes cada componente pasaba
// `pathPrefix: business?.id || 'default'` y ese fallback 'default' era una
// carpeta compartida entre tenants.
export function useImageUpload({
  bucket,
  filePrefix,
  maxFileSize,
  acceptedTypes = ['image/'],
  compress,
}: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = useCallback(() => setUploadError(null), []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (maxFileSize && file.size > maxFileSize) {
      const mb = (maxFileSize / (1024 * 1024)).toFixed(0);
      throw new Error(`La imagen supera los ${mb}MB`);
    }

    if (!acceptedTypes.some(t => file.type.startsWith(t))) {
      throw new Error('Solo se permiten imágenes');
    }

    const blob = compress ? await compress(file) : file;
    const contentType = blob.type || file.type;
    const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp';
    const name = `${filePrefix}-${Date.now()}.${ext}`;

    return await uploadStorageFile(bucket, name, blob, contentType);
  }, [bucket, filePrefix, maxFileSize, acceptedTypes, compress]);

  const handleFileChange = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void,
    onError?: (msg: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onSuccess(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir la imagen';
      setUploadError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadFile]);

  return {
    uploading,
    uploadError,
    clearError,
    fileInputRef,
    uploadFile,
    handleFileChange,
  } as const;
}
