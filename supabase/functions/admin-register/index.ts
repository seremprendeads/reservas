import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`admin-register:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, intente más tarde", 429);
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return jsonError("Todos los campos son obligatorios", 400);
    }

    if (password.length < 6) {
      return jsonError("La contraseña debe tener al menos 6 caracteres", 400);
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return jsonError("El email ya está registrado", 400);
    }

    const { error } = await supabase.rpc("create_admin_user", {
      p_email: email,
      p_password: password,
      p_name: name,
    });

    if (error) throw error;

    return jsonSuccess({
      message: "Cuenta creada. Creá tu negocio desde el panel.",
    });
  } catch (err) {
    console.error("admin-register error:", err);
    return jsonError("Error interno");
  }
});
