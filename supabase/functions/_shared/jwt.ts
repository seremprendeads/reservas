// JWT helper for admin authentication
// Uses HMAC-SHA256 signing via Deno's Web Crypto API

const encoder = new TextEncoder();

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface AdminTokenPayload {
  sub: string;       // admin user id
  email: string;
  business_id: string | null;
  iat: number;       // issued at (seconds)
  exp: number;       // expires at (seconds)
}

export async function signToken(
  payload: Omit<AdminTokenPayload, "iat" | "exp">,
  secret: string,
  expiresInHours = 24
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  };

  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(fullPayload)));
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return `${data}.${base64url(new Uint8Array(signature))}`;
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<AdminTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const key = await getKey(secret);
    const signature = base64urlDecode(sigB64);

    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(data));
    if (!valid) return null;

    const payload: AdminTokenPayload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64))
    );

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
