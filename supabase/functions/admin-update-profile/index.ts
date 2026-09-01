import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBusinessAccess, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBusinessAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const { name: newName, newEmail, newPassword, avatar_url } = await req.json();

    const supabase = createServiceClient();
    const cleanEmail = auth.admin.email ? auth.admin.email.trim().toLowerCase() : "";
    const cleanNewEmail = newEmail ? newEmail.trim().toLowerCase() : null;

    const updates: Record<string, string> = {};
    if (newName !== undefined && newName !== null) {
      if (newName.trim().length < 2) {
        return jsonError("El nombre debe tener al menos 2 caracteres", 400);
      }
      updates.name = newName.trim();
    }

    if (cleanNewEmail && cleanNewEmail !== cleanEmail) {
      if (!cleanNewEmail.includes('@')) {
        return jsonError("Email inválido", 400);
      }
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .ilike("email", cleanNewEmail)
        .neq("id", auth.admin.id)
        .maybeSingle();

      if (existing) {
        return jsonError("El email ya está en uso por otro administrador", 400);
      }
      updates.email = cleanNewEmail;
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

      // Try update_admin_password_by_id first using admin ID directly
      const { error: pwByIdError } = await supabase.rpc("update_admin_password_by_id", {
        p_id: auth.admin.id,
        p_new_password: newPassword,
      });

      if (pwByIdError) {
        // Fallback to update_admin_password_direct
        const targetEmail = cleanNewEmail || cleanEmail;
        const { error: pwError } = await supabase.rpc("update_admin_password_direct", {
          p_email: targetEmail,
          p_new_password: newPassword,
        });
        if (pwError) throw pwError;
      }

      // Al cambiar la contraseña, marcar que ya no es temporal
      await supabase
        .from("admin_users")
        .update({ must_change_password: false })
        .eq("id", auth.admin.id);
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-profile error:", err);
    return jsonError("Error interno del servidor");
  }
});
