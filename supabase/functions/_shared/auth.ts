// Shared authentication helper for all edge functions
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyToken, AdminTokenPayload } from "./jwt.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function createServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ============================================================================
// SUBSCRIPTION GUARD
// Verifica server-side que el negocio tiene acceso activo (trial vigente o plan pago).
// TRIAL_DAYS = 18 días para prospección directa beta.
// Devuelve null si el acceso está OK, o un objeto de error si debe bloquearse.
// ============================================================================

export const TRIAL_DAYS = 18;

export type AccessStatus =
  | { allowed: true }
  | { allowed: false; reason: "suspended" | "trial_expired" | "business_not_found" | "free_plan"; message: string };

export async function checkBusinessAccess(businessId: string): Promise<AccessStatus> {
  const supabase = createServiceClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("is_active, is_trial, trial_ends_at, plan")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) {
    return { allowed: false, reason: "business_not_found", message: "Negocio no encontrado" };
  }

  if (!biz.is_active) {
    return { allowed: false, reason: "suspended", message: "Cuenta suspendida. Contactá soporte." };
  }

  // Si está en trial, verificar vencimiento usando el servidor (Date.now() en Edge Function, no en el browser)
  if (biz.is_trial) {
    if (!biz.trial_ends_at) {
      // Sin fecha de fin → acceso OK (negocio muy nuevo, el trigger debería haberla seteado)
      return { allowed: true };
    }
    const trialEnd = new Date(biz.trial_ends_at);
    if (trialEnd.getTime() <= Date.now()) {
      return {
        allowed: false,
        reason: "trial_expired",
        message: `Tu período de prueba de ${TRIAL_DAYS} días ha vencido. Elegí un plan para continuar.`,
      };
    }
  }

  // Plan free post-trial: solo la bio está disponible.
  // Las Edge Functions de reservas, shop, landing, branding, etc. deben ser bloqueadas.
  // La Edge Function admin-update-bio usa checkBioAccess (no checkBusinessAccess),
  // por lo que este bloqueo no afecta a la bio.
  if (!biz.is_trial && biz.plan === "free") {
    return {
      allowed: false,
      reason: "free_plan",
      message: "Tu período de prueba terminó. Solo tenés acceso a la Bio gratuita. Elegí un plan para continuar.",
    };
  }

  // Plan pago activo (is_trial = false, plan != 'free', is_active = true) → acceso OK
  return { allowed: true };
}

// ============================================================================
// MASTER ADMIN AUTH
// Completamente separado de authenticateToken/authenticateAdmin.
// Usa MASTER_JWT_SECRET distinto de JWT_SECRET.
// Un JWT de tenant no puede pasar este check (secrets diferentes).
// Un JWT de master no puede pasar authenticateToken (mismo motivo).
// ============================================================================

export interface MasterTokenPayload {
  sub: string;    // master_admin id
  email: string;
  role: "master"; // literal fijo — nunca viene del cliente
  iat: number;
  exp: number;
}

export async function authenticateMaster(req: Request): Promise<
  | { master: { id: string; email: string; name: string } }
  | { error: string; status: 401 }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "No autorizado", status: 401 as const };
  }

  const token = authHeader.slice(7);
  const secret = Deno.env.get("MASTER_JWT_SECRET");
  if (!secret) {
    console.error("MASTER_JWT_SECRET not configured");
    return { error: "Configuración incorrecta", status: 401 as const };
  }

  // Verificar con MASTER_JWT_SECRET — un token de tenant (firmado con JWT_SECRET)
  // fallará aquí con firma inválida. No hay forma de cruzarlos.
  const { verifyToken: verify } = await import("./jwt.ts");
  const raw = await verify(token, secret);
  if (!raw) {
    return { error: "Token inválido o expirado", status: 401 as const };
  }

  // Verificar que el payload tiene role: "master"
  // Esto previene que un payload de tenant (sin role) pase aunque la firma fuera válida
  const payload = raw as unknown as MasterTokenPayload;
  if (payload.role !== "master") {
    return { error: "No autorizado", status: 401 as const };
  }

  // DB lookup fresco — verificar que el master existe y está activo
  const supabase = createServiceClient();
  const { data: master } = await supabase
    .from("master_admins")
    .select("id, email, name, is_active")
    .eq("id", payload.sub)
    .maybeSingle();

  if (!master || !master.is_active) {
    return { error: "No autorizado", status: 401 as const };
  }

  return { master: { id: master.id, email: master.email, name: master.name } };
}

// Verify JWT token from Authorization header
export async function authenticateToken(req: Request): Promise<
  | { admin: { id: string; email: string; name: string | null; business_id: string | null }; businessId: string }
  | { error: string; status: 401 }
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "No autorizado", status: 401 as const };
  }

  const token = authHeader.slice(7);
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    console.error("JWT_SECRET not configured");
    return { error: "Configuración incorrecta", status: 401 as const };
  }

  const payload: AdminTokenPayload | null = await verifyToken(token, secret);
  if (!payload) {
    return { error: "Token inválido o expirado", status: 401 as const };
  }

  // Fetch fresh admin data from DB
  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, name, business_id")
    .eq("id", payload.sub)
    .maybeSingle();

  if (!admin) {
    return { error: "Usuario no encontrado", status: 401 as const };
  }

  // Si el admin no tiene business_id asignado, rechazar en lugar de asignar automáticamente.
  // Un admin sin negocio debe completar el flujo /create-business.
  if (!admin.business_id) {
    return { error: "No tenés un negocio asociado. Completá el registro en /create-business.", status: 401 as const };
  }

  return { admin, businessId: admin.business_id as string };
}

// Legacy: password-based auth (used only by admin-login and admin-register)
export async function authenticateAdmin(email: string, password: string) {
  const supabase = createServiceClient();
  const cleanEmail = (email || "").trim().toLowerCase();

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id, email, name, password_hash, business_id, must_change_password")
    .ilike("email", cleanEmail)
    .maybeSingle();

  if (adminError || !admin) {
    return { error: "No autorizado", status: 401 as const };
  }

  const { data: verified } = await supabase.rpc("verify_admin_password", {
    input_password: password,
    stored_hash: admin.password_hash,
  });

  if (!verified) {
    return { error: "No autorizado", status: 401 as const };
  }

  // ELIMINADO: el fallback que asignaba automáticamente el primer negocio activo.
  // Si el admin no tiene business_id, retorna error claro. Debe completar /create-business.
  if (!admin.business_id) {
    return { error: "No tenés un negocio asociado. Completá el registro desde el panel.", status: 401 as const };
  }

  return { admin, businessId: admin.business_id as string };
}

export function jsonSuccess(data: Record<string, unknown> = { success: true }) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function jsonError(error: string, status = 500) {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function jsonUnauthorized() {
  return jsonError("No autorizado", 401);
}

// ============================================================================
// checkBioAccess
// La bio está disponible en TODOS los planes, incluyendo free.
// Solo se bloquea si la cuenta está suspendida (is_active = false).
// ============================================================================
export async function checkBioAccess(businessId: string): Promise<AccessStatus> {
  const supabase = createServiceClient();
  const { data: biz } = await supabase
    .from("businesses")
    .select("is_active")
    .eq("id", businessId)
    .maybeSingle();

  if (!biz) {
    return { allowed: false, reason: "business_not_found", message: "Negocio no encontrado" };
  }

  if (!biz.is_active) {
    return { allowed: false, reason: "suspended", message: "Cuenta suspendida. Contactá soporte." };
  }

  return { allowed: true };
}

export function jsonAccessDenied(message: string, reason?: string) {
  return new Response(JSON.stringify({ success: false, error: message, access_denied: true, reason: reason || "access_denied" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Simple in-memory rate limiter (per-instance, not distributed)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 5 * 60 * 1000);
}