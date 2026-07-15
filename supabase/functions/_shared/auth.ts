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

// Verify JWT token from Authorization header
export async function authenticateToken(req: Request): Promise<
  { admin: { id: string; email: string; name: string | null; business_id: string | null }; businessId: string } |
  { error: string; status: 401 }
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

  return { admin, businessId: admin.business_id as string };
}

// Legacy: password-based auth (used only by admin-login and admin-register)
export async function authenticateAdmin(email: string, password: string) {
  const supabase = createServiceClient();

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id, email, name, password_hash, business_id")
    .eq("email", email)
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

  // If admin doesn't have a business_id, assign to the first active business
  if (!admin.business_id) {
    const { data: defaultBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (defaultBusiness) {
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({ business_id: defaultBusiness.id })
        .eq("id", admin.id);

      if (updateError) {
        console.error("Error assigning business:", updateError);
      }

      admin.business_id = defaultBusiness.id;
    }
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
