import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const { name: newName, newEmail, newPassword, avatar_url } = await req.json();

    const supabase = createServiceClient();
    const email = auth.admin.email;

    const updates: Record<string, string> = {};
    if (newName !== undefined && newName !== null) {
      if (newName.trim().length < 2) {
        return jsonError("El nombre debe tener al menos 2 caracteres", 400);
      }
      updates.name = newName.trim();
    }

    if (newEmail !== undefined && newEmail !== null && newEmail !== email) {
      if (!newEmail.includes('@')) {
        return jsonError("Email inválido", 400);
      }
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", newEmail.trim())
        .neq("id", auth.admin.id)
        .maybeSingle();

      if (existing) {
        return jsonError("El email ya está en uso por otro administrador", 400);
      }
      updates.email = newEmail.trim();
    }

    if (avatar_url !== undefined && avatar_url !== null) {
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("admin_users")
        .update(updates)
        .eq("id", auth.admin.id);

      if (updateError) throw updateError;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return jsonError("La nueva contraseña debe tener al menos 6 caracteres", 400);
      }
      const targetEmail = newEmail?.trim() || email;
      const { error: pwError } = await supabase.rpc("update_admin_password_direct", {
        p_email: targetEmail,
        p_new_password: newPassword,
      });
      if (pwError) throw pwError;
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-profile error:", err);
    return jsonError("Error interno del servidor");
  }
});
