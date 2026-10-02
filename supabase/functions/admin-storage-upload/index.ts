import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBusinessAccess, checkRateLimit, corsHeaders } from "../_shared/auth.ts";

// ============================================================================
// C.3 - SUBIDA DE ARCHIVOS CON OWNERSHIP REAL
//
// Que estaba roto y por que:
//
//   El login del panel es custom (admin-login devuelve un JWT propio). En todo
//   el proyecto no hay ni un supabase.auth.*, asi que el browser NUNCA tiene
//   sesion de Supabase Auth. Eso significa que cada supabase.storage.upload()
//   sale con la anon key y sin sesion.
//
//   Con la anon key, RLS de storage.objects no tiene contra que comparar:
//   no hay auth.uid() ni un claim de business. El business_id del path lo elige
//   el cliente y es informacion que el atacante controla. Por eso la migracion
//   20260822000000 tuvo que abrir el bucket a anon para que los uploads
//   funcionaran: se pago funcionalidad con aislamiento entre tenants.
//
//   Consecuencia real: con la anon key, CUALQUIER visitante podia escribir o
//   borrar archivos en la carpeta de CUALQUIER negocio, si knew o adivinaba el
//   business_id (que es un UUID visible en las URLs publicas del sitio).
//
// Que hace esta funcion:
//
//   El path deja de ser confiado. El primer segmento del path TIENE que ser
//   igual a auth.businessId, que viene del JWT firmado por el servidor y no del
//   cliente. Si no coincide, se rechaza. Con eso la carpeta deja de ser una
//   eleccion del atacante y pasa a estar atada a su propia cuenta.
//
//   Con las policies de storage cerradas a anon, esto es el unico camino de
//   escritura: el service role de esta funcion.
//
// Formato: JSON con el archivo en base64. Se elige base64 y no multipart porque
// supabase.functions.invoke() ya serializa el body a JSON y evita tener que
// construir FormData a mano en los 5 call sites del frontend.
//
// El borrado va en la misma funcion y no en otra a proposito: la validacion de
// path es la parte critica, y duplicarla en dos funciones garantiza que una de
// las dos se quede vieja.
// ============================================================================

// Allowlist de buckets. Un bucket que no este aca no se puede escribir, aunque
// exista en storage.buckets. Los limites replican los del INSERT de
// storage.buckets (20260722000000 / 20260715090000) para fallar antes de
// consumir ancho de banda con un archivo que Storage iba a rechazar igual.
//
// avatars no tiene INSERT en storage.buckets en ninguna migracion del repo: se
// creo a mano o nunca existio, y sus subidas de avatar estan rotas. Se incluye
// aca porque ProfileManager necesita el bucket, y el limite de 2MB es el mismo
// maxFileSize que el componente ya usaba.
const BUCKETS: Record<string, { maxBytes: number; mimeTypes: string[] }> = {
  branding: {
    maxBytes: 5242880, // 5 MB
    mimeTypes: ["image/webp", "image/jpeg", "image/png"],
  },
  "shop-images": {
    maxBytes: 2097152, // 2 MB
    mimeTypes: ["image/webp", "image/jpeg", "image/png"],
  },
  avatars: {
    maxBytes: 2097152, // 2 MB
    mimeTypes: ["image/webp", "image/jpeg", "image/png"],
  },
};

// Techo de caracteres del nombre, para que nadie abuse del path como canal.
const MAX_FILENAME_LENGTH = 200;

// Mesmo limite usado en admin-forgot-password: es por instancia, no
// distribuido. Sirve para frenar un loop de upload desde una pestana, no a un
// atacante distributed. 30 archivos cada 5 minutos esta muy por encima de lo
// que hace un panel en uso normal.
const UPLOADS_MAX = 30;
const UPLOADS_WINDOW_MS = 5 * 60 * 1000;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================================================
// Validacion del path. Esta es la parte que cierra C.3.
// ============================================================================
function validatePath(filename: unknown, businessId: string): { ok: true; path: string } | { ok: false; error: string } {
  if (typeof filename !== "string" || filename.length === 0) {
    return { ok: false, error: "Falta el nombre del archivo" };
  }
  if (filename.length > MAX_FILENAME_LENGTH) {
    return { ok: false, error: "Nombre de archivo demasiado largo" };
  }

  const path = filename.trim();

  // Separadores de windows o ruta absoluta: el path se guarda como clave de
  // storage, no como ruta de filesystem, pero un backslash o un / inicial
  // producen objetos que ninguna policy espera.
  if (path.includes("\\") || path.startsWith("/")) {
    return { ok: false, error: "Ruta de archivo invalida" };
  }

  const segments = path.split("/");

  // Segmentos vacios ("a//b", "a/b/") y recorridos ("../") no tienen sentido en
  // un bucket y son el camino clasico para salir de la carpeta esperada.
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    return { ok: false, error: "Ruta de archivo invalida" };
  }

  // El binding con el tenant. Es lo unico que impide escribir en la carpeta de
  // otro negocio: businessId viene del JWT verificado, no del body.
  if (segments[0] !== businessId) {
    console.error("[admin-storage-upload] Path fuera del propio tenant rechazado");
    return { ok: false, error: "No podes subir archivos a la carpeta de otro negocio" };
  }

  return { ok: true, path: segments.join("/") };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBusinessAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const rate = checkRateLimit(`storage:${auth.businessId}`, UPLOADS_MAX, UPLOADS_WINDOW_MS);
    if (!rate.allowed) {
      return jsonError("Demasiadas subidas seguidas. Espera unos minutos.", 429);
    }

    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    const { action, bucket, filename, contentType, dataBase64 } = body as {
      action?: unknown;
      bucket?: unknown;
      filename?: unknown;
      contentType?: unknown;
      dataBase64?: unknown;
    };

    if (action !== undefined && action !== "upload" && action !== "delete") {
      return jsonError("Accion invalida", 400);
    }

    // ------------------------------------------------------------------
    // Bucket
    // ------------------------------------------------------------------
    if (typeof bucket !== "string" || !Object.prototype.hasOwnProperty.call(BUCKETS, bucket)) {
      return jsonError("Bucket no permitido", 400);
    }
    const bucketConfig = BUCKETS[bucket];

    // ------------------------------------------------------------------
    // Path atado al business_id del admin autenticado (cierra C.3)
    // Se valida antes de mirar la accion: tanto subir como borrar pasan por
    // exactamente el mismo control de tenant.
    // ------------------------------------------------------------------
    const pathCheck = validatePath(filename, auth.businessId);
    if (!pathCheck.ok) {
      return jsonError(pathCheck.error, 400);
    }

    // ------------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------------
    if (action === "delete") {
      const supabase = createServiceClient();
      const { error } = await supabase.storage.from(bucket).remove([pathCheck.path]);
      if (error) {
        console.error("[admin-storage-upload] Remove error:", error.message);
        return jsonError("No se pudo borrar el archivo", 500);
      }
      return jsonSuccess({ path: pathCheck.path, deleted: true });
    }

    // ------------------------------------------------------------------
    // Tipo MIME: tiene que estar en la allowlist del bucket. Storage valida
    // contra storage.buckets, pero se chequea aca para no subir ni el binario
    // antes de que lo rechace.
    // ------------------------------------------------------------------
    if (typeof contentType !== "string" || !bucketConfig.mimeTypes.includes(contentType)) {
      return jsonError("Tipo de archivo no permitido", 400);
    }

    // ------------------------------------------------------------------
    // Payload
    // ------------------------------------------------------------------
    if (typeof dataBase64 !== "string" || dataBase64.length === 0) {
      return jsonError("Falta el contenido del archivo", 400);
    }

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(dataBase64);
    } catch {
      return jsonError("Archivo invalido", 400);
    }

    if (bytes.length === 0) {
      return jsonError("Archivo vacio", 400);
    }
    if (bytes.length > bucketConfig.maxBytes) {
      const mb = (bucketConfig.maxBytes / (1024 * 1024)).toFixed(0);
      return jsonError(`El archivo supera los ${mb}MB`, 400);
    }

    // ------------------------------------------------------------------
    // Subida. Corre con service role: las policies de storage quedan cerradas
    // a anon y esta funcion es el unico camino de escritura.
    // ------------------------------------------------------------------
    const supabase = createServiceClient();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(pathCheck.path, bytes, { upsert: false, contentType });

    if (error) {
      console.error("[admin-storage-upload] Upload error:", error.message);
      return jsonError("No se pudo subir el archivo", 500);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(pathCheck.path);

    return jsonSuccess({
      path: pathCheck.path,
      publicUrl: urlData?.publicUrl || "",
      size: bytes.length,
    });
  } catch (err) {
    console.error("admin-storage-upload error:", err);
    return jsonError("Error interno");
  }
});