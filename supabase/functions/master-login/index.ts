import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders, checkRateLimit } from "../_shared/auth.ts";
import { signToken } from "../_shared/jwt.ts";
import type { MasterTokenPayload } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limiting: máx 5 intentos por IP por minuto
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`master-login:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiados intentos. Esperá un momento.", 429);
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return jsonError("Email y contraseña requeridos", 400);
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const supabase = createServiceClient();

    // Buscar master admin
    const { data: master } = await supabase
      .from("master_admins")
      .select("id, email, name, password_hash, is_active")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (!master || !master.is_active) {
      return jsonUnauthorized();
    }

    // Verificar contraseña con bcrypt
    const { data: verified } = await supabase.rpc("verify_master_password", {
      input_password: password,
      stored_hash: master.password_hash,
    });

    if (!verified) {
      return jsonUnauthorized();
    }

    const masterSecret = Deno.env.get("MASTER_JWT_SECRET");
    if (!masterSecret) {
      console.error("MASTER_JWT_SECRET not configured");
      return jsonError("Configuración incorrecta", 500);
    }

    // Firmar con MASTER_JWT_SECRET — completamente separado de JWT_SECRET de tenants
    // El payload incluye role: "master" como campo fijo del servidor
    const tokenPayload = {
      sub: master.id,
      email: master.email,
      business_id: null,        // master no tiene business_id
      role: "master" as const,  // fijo en servidor, nunca del cliente
    };

    // signToken espera AdminTokenPayload shape — usar cast controlado
    const token = await signToken(tokenPayload as Parameters<typeof signToken>[0], masterSecret, 8);

    return jsonSuccess({
      success: true,
      token,
      name: master.name,
      email: master.email,
    });
  } catch (err) {
    console.error("master-login error:", err);
    return jsonError("Error interno");
  }
});
