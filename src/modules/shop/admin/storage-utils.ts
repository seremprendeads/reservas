import { deleteStorageFileSecure } from '../../../lib/storage-upload';

export function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.substring(idx + marker.length).split('?')[0];
  return path || null;
}

export async function deleteStorageFile(url: string, bucket: string): Promise<void> {
  const path = extractStoragePath(url, bucket);
  if (!path) return;
  // Pasa por la Edge Function para que el servidor valide que el path
  // pertenece al negocio de la sesion antes de borrar.
  await deleteStorageFileSecure(bucket, path);
}
