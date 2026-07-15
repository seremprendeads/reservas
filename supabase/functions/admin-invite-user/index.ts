import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const { target_email, role } = await req.json();
    const email = auth.admin.email;

    if (!target_email) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    // Only owners and admins can invite
    const supabase = createServiceClient();
    const { data: memberRole } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", auth.businessId)
      .eq("user_email", email)
      .maybeSingle();

    if (!memberRole || !["owner", "admin"].includes(memberRole.role)) {
      return jsonError("No tenés permiso para invitar usuarios", 403);
    }

    // Check if target email is already a member
    const { data: existingMember } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", auth.businessId)
      .eq("user_email", target_email)
      .maybeSingle();

    if (existingMember) {
      return jsonError("Este email ya es miembro del negocio", 400);
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from("invite_tokens")
      .select("id")
      .eq("business_id", auth.businessId)
      .eq("email", target_email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return jsonError("Ya hay una invitación pendiente para este email", 400);
    }

    // Create invite token
    const token = generateToken();
    const { error: insertError } = await supabase.from("invite_tokens").insert({
      business_id: auth.businessId,
      email: target_email,
      role: role || "member",
      token,
      invited_by: email,
    });

    if (insertError) throw insertError;

    // Send invite email
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      // Get business name for the email
      const { data: biz } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", auth.businessId)
        .maybeSingle();

      const businessName = biz?.name || "un negocio";
      const roleLabel = role === "admin" ? "Administrador" : role === "viewer" ? "Observador" : "Miembro";
      const inviteUrl = `${req.headers.get("origin") || "https://reservasturnos.com"}/accept-invite?token=${token}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Reservas <noreply@reservasturnos.com>",
          to: target_email,
          subject: `Invitación a ${businessName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0;">Te invitamos a ${businessName}</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 12px;">
                <p style="font-size: 16px; color: #1f2937;">Hola,</p>
                <p style="color: #4b5563;">${email} te invitó a unirte como <strong>${roleLabel}</strong> al negocio <strong>${businessName}</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
                    Aceptar invitación
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Si no tenés cuenta, podrás crear una al hacer click. Esta invitación expira en 7 días.</p>
              </div>
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Este es un email automático, por favor no responda.</p>
            </body>
            </html>
          `,
        }),
      });
    }

    return jsonSuccess({
      message: "Invitación creada",
      invite_link: `/accept-invite?token=${token}`,
    });
  } catch (err) {
    console.error("admin-invite-user error:", err);
    return jsonError("Error interno");
  }
});
