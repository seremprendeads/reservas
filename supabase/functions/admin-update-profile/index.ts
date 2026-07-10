import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, name: newName, newEmail, newPassword, avatar_url } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email y contraseña requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar credenciales actuales
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, email, name, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: verified } = await supabase.rpc("verify_admin_password", {
      input_password: password,
      stored_hash: admin.password_hash,
    });

    if (!verified) {
      return new Response(
        JSON.stringify({ success: false, error: "Contraseña actual incorrecta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construir actualización de datos básicos
    const updates: Record<string, string> = {};
    if (newName !== undefined && newName !== null) {
      if (newName.trim().length < 2) {
        return new Response(
          JSON.stringify({ success: false, error: "El nombre debe tener al menos 2 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      updates.name = newName.trim();
    }

    if (newEmail !== undefined && newEmail !== null && newEmail !== email) {
      if (!newEmail.includes('@')) {
        return new Response(
          JSON.stringify({ success: false, error: "Email inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Verificar que el email no esté en uso por otro admin
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", newEmail.trim())
        .neq("id", admin.id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: false, error: "El email ya está en uso por otro administrador" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      updates.email = newEmail.trim();
    }

    // Avatar URL
    if (avatar_url !== undefined && avatar_url !== null) {
      updates.avatar_url = avatar_url;
    }

    // Actualizar nombre y/o email
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("admin_users")
        .update(updates)
        .eq("id", admin.id);

      if (updateError) throw updateError;
    }

    // Actualizar contraseña si se proporcionó una nueva
    if (newPassword) {
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const targetEmail = newEmail?.trim() || email;
      const { error: pwError } = await supabase.rpc("update_admin_password_direct", {
        p_email: targetEmail,
        p_new_password: newPassword,
      });
      if (pwError) throw pwError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
