import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limit: 5 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`admin-register:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, intente más tarde", 429);
    }

    const { name, email, password, invite_token } = await req.json();

    if (!name || !email || !password) {
      return jsonError("Todos los campos son obligatorios", 400);
    }

    if (password.length < 6) {
      return jsonError("La contraseña debe tener al menos 6 caracteres", 400);
    }

    const supabase = createServiceClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return jsonError("El email ya está registrado", 400);
    }

    // Validate invite token if provided
    let validInvite = null;
    if (invite_token) {
      const { data: invite } = await supabase
        .from("invite_tokens")
        .select("*")
        .eq("token", invite_token)
        .eq("email", email)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!invite) {
        return jsonError("Invitación no válida o expirada", 400);
      }
      validInvite = invite;
    }

    // Create admin user
    const { error } = await supabase.rpc("create_admin_user", {
      p_email: email,
      p_password: password,
      p_name: name,
    });

    if (error) throw error;

    // Get the new admin user
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (adminUser && validInvite) {
      // Assign to the business from the invite
      await supabase
        .from("admin_users")
        .update({ business_id: validInvite.business_id })
        .eq("id", adminUser.id);

      // Add as member of the business
      await supabase
        .from("business_members")
        .insert({
          business_id: validInvite.business_id,
          user_email: email,
          role: validInvite.role,
        })
        .select();

      // Mark invite as accepted
      await supabase
        .from("invite_tokens")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", validInvite.id);

      return jsonSuccess({
        message: "Cuenta creada y unida al negocio",
        business_id: validInvite.business_id,
      });
    }

    return jsonSuccess({
      message: "Cuenta creada. Un administrador existente debe invitarte a un negocio.",
    });
  } catch (err) {
    console.error("admin-register error:", err);
    return jsonError("Error interno");
  }
});
