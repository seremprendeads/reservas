import { supabase } from './supabase';
import { getToken, getBusinessId } from './admin-session';

// ============================================================================
// C.3 - SUBIDA Y BORRADO DE ARCHIVOS CON OWNERSHIP
//
// Por que esto ya no usa supabase.storage directo:
//
//   El login del panel es custom (admin-login devuelve un JWT propio) y el
//   proyecto no usa Supabase Auth en ningun lado. El browser nunca tiene
//   sesion, asi que supabase.storage.upload() salia con la anon key.
//
//   Con la anon key, RLS de storage no tiene contra que validar el business_id
//   del path: lo elige el cliente. Por eso el bucket branding quedo abierto a
//   anon, y con la anon key (publica, va dentro del bundle) cualquier visitante
//   podia escribir o borrar en la carpeta de cualquier negocio.
//
//   Ahora la escritura pasa por la Edge Function admin-storage-upload, que corre
//   con service role y exige que el primer segmento del path sea el
//   business_id del admin autenticado, tomado del JWT firmado.
//
// Los buckets quedan cerrados a anon en
// 20261002100000_lock_down_storage_writes.sql, asi que TODA subida y toda baja
// de archivos de negocio tiene que pasar por este modulo.
//
// Que el nombre del archivo NO incluya el business_id es intencional: la carpeta
// se arma aca con el id de la sesion. Asi es estructuralmente imposible escribir
// en la carpeta de otro negocio, y no queda en mano de cada call site acordarse
// del prefijo (que era justo el origen del fallback 'default').
// ============================================================================

const UPLOAD_FN = 'admin-storage-upload';

// Allowlist espejada de BUCKETS en la Edge Function. Se valida aca para fallar
// antes de subir el binario, no porque el cliente sea una frontera de confianza:
// la validacion que manda es la del servidor.
const BUCKETS: Record<string, { maxBytes: number; mimeTypes: string[] }> = {
  branding: {
    maxBytes: 5242880, // 5 MB
    mimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  },
  'shop-images': {
    maxBytes: 2097152, // 2 MB
    mimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  },
  avatars: {
    maxBytes: 2097152, // 2 MB
    mimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
  },
};

function invokeStorage(body: Record<string, unknown>) {
  return supabase.functions.invoke(UPLOAD_FN, {
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  });
}

// supabase.functions.invoke manda toda respuesta non-2xx a `error` y deja el
// body real sin leer en error.context. Sin esto, el mensaje util del servidor
// ("No podes subir archivos a la carpeta de otro negocio") se pierde y el
// usuario ve un genérico "non-2xx status code".
async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return body.error as string;
    } catch {
      // el body no era JSON: seguimos con el fallback
    }
  }
  if (
    error instanceof Error &&
    error.message &&
    error.message !== 'Edge Function returned a non-2xx status code'
  ) {
    return error.message;
  }
  return fallback;
}

// Convierte un Blob a base64 sin FileReader, que no esta en todos los
// navegadores objetivo. Se arma un string binario a mano porque aplicar btoa a
// un Uint8Array crudo revienta con bytes > 127.
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function getStorageBucketConfig(bucket: string) {
  return BUCKETS[bucket];
}

/**
 * Sube un archivo al bucket de negocio y devuelve la URL publica con cache-bust.
 *
 * @param bucket  'branding' | 'shop-images'
 * @param name    Nombre del archivo SIN la carpeta inicial. Se antepone
 *                automaticamente el business_id de la sesion.
 * @param blob    Contenido ya comprimido por el llamador.
 * @param contentType  MIME del blob. Debe coincidir con el tipo real del
 *                     contenido: el servidor lo valida contra la allowlist del
 *                     bucket y Storage lo vuelve a validar.
 */
export async function uploadStorageFile(
  bucket: string,
  name: string,
  blob: Blob,
  contentType: string,
): Promise<string> {
  const config = BUCKETS[bucket];
  if (!config) throw new Error('Bucket no permitido');
  if (!config.mimeTypes.includes(contentType)) throw new Error('Tipo de archivo no permitido');
  if (blob.size > config.maxBytes) {
    throw new Error(`La imagen supera los ${(config.maxBytes / (1024 * 1024)).toFixed(0)}MB`);
  }

  const businessId = getBusinessId();
  if (!businessId) throw new Error('No tenés un negocio asignado');

  // La carpeta sale siempre de la sesion, nunca del llamador.
  const filename = `${businessId}/${name}`;

  const { data, error } = await invokeStorage({
    action: 'upload',
    bucket,
    filename,
    contentType,
    dataBase64: await blobToBase64(blob),
  });

  if (error) throw new Error(await readFunctionError(error, 'No se pudo subir la imagen'));
  const result = data as { success?: boolean; publicUrl?: string; error?: string } | null;
  if (!result?.success || !result?.publicUrl) {
    throw new Error(result?.error || 'Error al subir la imagen');
  }

  return `${result.publicUrl}?t=${Date.now()}`;
}

/**
 * Borra un archivo del bucket de negocio.
 *
 * @param path Path completo dentro del bucket, tal como sale de
 *             extractStoragePath() sobre una URL publica.
 *
 * El servidor valida que el path pertenezca al negocio de la sesion, asi que
 * un path ajeno devuelve error y no borra nada. No se propaga el error: los
 * llamadores usan esto como limpieza best-effort y no debe romper el guardado
 * que ya se completo.
 */
export async function deleteStorageFileSecure(bucket: string, path: string): Promise<void> {
  if (!Object.prototype.hasOwnProperty.call(BUCKETS, bucket)) return;

  const { error } = await invokeStorage({
    action: 'delete',
    bucket,
    filename: path,
  });

  if (error) {
    console.error('No se pudo borrar el archivo:', await readFunctionError(error, 'Error al borrar'));
  }
}