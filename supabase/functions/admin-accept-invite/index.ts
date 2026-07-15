import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateAdmin, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, token } = await req.json();

    if (!email || !password || !token) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    // Authenticate the user accepting the invite
    const auth = await authenticateAdmin(email, password);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const supabase = createServiceClient();

    // Find the invite
    const { data: invite, error: findError } = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (findError) throw findError;

    if (!invite) {
      return jsonError("Invitación no válida o ya expirada", 404);
    }

    // The email in the invite must match the authenticated user
    if (invite.email !== email) {
      return jsonError("Esta invitación no es para tu email", 403);
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", invite.business_id)
      .eq("user_email", email)
      .maybeSingle();

    if (existingMember) {
      // Already a member, just mark invite as accepted
      await supabase
        .from("invite_tokens")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      return jsonSuccess({ message: "Ya eres miembro de este negocio" });
    }

    // Add to business_members
    const { error: memberError } = await supabase
      .from("business_members")
      .insert({
        business_id: invite.business_id,
        user_email: email,
        role: invite.role,
      });

    if (memberError) throw memberError;

    // Update admin_users with business_id if not set
    await supabase
      .from("admin_users")
      .update({ business_id: invite.business_id })
      .eq("id", auth.admin.id)
      .is("business_id", null);

    // Mark invite as accepted
    await supabase
      .from("invite_tokens")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return jsonSuccess({
      message: "Invitación aceptada",
      business_id: invite.business_id,
    });
  } catch (err) {
    console.error("admin-accept-invite error:", err);
    return jsonError("Error interno");
  }
});
