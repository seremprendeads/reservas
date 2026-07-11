import { supabase } from '../../../lib/supabase';

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
  await supabase.storage.from(bucket).remove([path]);
}
