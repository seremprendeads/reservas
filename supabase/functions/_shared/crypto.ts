// ============================================================================
// Cifrado de credenciales en reposo (AES-256-GCM).
//
// Por qué: payment_providers guarda el Access Token de Mercado Pago de cada
// cliente. Ese token permite operar por API sobre SU cuenta (cobrar, consultar,
// reembolsar). Si alguna vez se filtra la base o la clave de servicio, en texto
// plano se van todos los tokens juntos. Cifrados, lo que se llevan no sirve.
//
// La clave vive SOLO en la variable de entorno TOKEN_ENCRYPTION_KEY de Supabase.
// Nunca en la base, nunca en el repo.
//
// Formato guardado:  enc:v1:<iv en base64>:<texto cifrado en base64>
// El prefijo permite distinguir lo cifrado de lo que quedó en texto plano,
// así descifrar() puede convivir con datos viejos sin romperlos.
// ============================================================================

const PREFIJO = "enc:v1:";

function b64Encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function b64Decode(texto: string): Uint8Array {
  return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));
}

async function obtenerClave(): Promise<CryptoKey> {
  const raw = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY no está configurada");
  }
  const bytes = b64Decode(raw);
  if (bytes.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY debe ser de 32 bytes en base64");
  }
  return await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/** Devuelve true si el valor ya está cifrado. */
export function estaCifrado(valor: string | null | undefined): boolean {
  return typeof valor === "string" && valor.startsWith(PREFIJO);
}

/**
 * Cifra un valor. Devuelve null si entra null/vacío.
 * Si falta la clave, lanza: nunca guardar en texto plano por error.
 */
export async function cifrar(valor: string | null | undefined): Promise<string | null> {
  if (!valor) return null;
  if (estaCifrado(valor)) return valor; // ya estaba cifrado, no cifrar dos veces

  const clave = await obtenerClave();
  // IV de 12 bytes, nuevo en cada cifrado. Nunca reutilizar con la misma clave.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifradoBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    clave,
    new TextEncoder().encode(valor)
  );

  return `${PREFIJO}${b64Encode(iv)}:${b64Encode(new Uint8Array(cifradoBuf))}`;
}

/**
 * Descifra un valor guardado. Si no tiene el prefijo, se asume texto plano
 * anterior al cifrado y se devuelve tal cual, para no romper datos existentes.
 */
export async function descifrar(valor: string | null | undefined): Promise<string | null> {
  if (!valor) return null;
  if (!estaCifrado(valor)) return valor;

  const resto = valor.slice(PREFIJO.length);
  const corte = resto.indexOf(":");
  if (corte === -1) throw new Error("Valor cifrado con formato inválido");

  const iv = b64Decode(resto.slice(0, corte));
  const datos = b64Decode(resto.slice(corte + 1));

  const clave = await obtenerClave();
  const planoBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, clave, datos);
  return new TextDecoder().decode(planoBuf);
}
