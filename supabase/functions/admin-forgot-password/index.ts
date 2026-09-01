import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limiting: máx 5 solicitudes por IP por minuto
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`admin-forgot-password:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiados intentos. Esperá un momento.", 429);
    }

    const { email } = await req.json();

    if (!email) {
      return jsonError("Email requerido", 400);
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const supabase = createServiceClient();

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, name, email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    // Respuesta genérica si el email no existe (previene enumeración de usuarios)
    if (!admin) {
      return jsonSuccess({ sent: true });
    }

    const tempPassword = generateTempPassword();

    // Intentar con update_admin_password_by_id primero (más seguro, por ID)
    const { error: pwByIdError } = await supabase.rpc("update_admin_password_by_id", {
      p_id: admin.id,
      p_new_password: tempPassword,
    });

    if (pwByIdError) {
      const { error: updateError } = await supabase.rpc("update_admin_password_direct", {
        p_email: admin.email,
        p_new_password: tempPassword,
      });
      if (updateError) throw updateError;
    }

    // Marcar must_change_password = true para forzar el cambio al ingresar
    await supabase
      .from("admin_users")
      .update({ must_change_password: true })
      .eq("id", admin.id);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@bookingbio.com";

    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: "🔑 Tu contraseña temporal - BookingBio",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <div style="background: #059669; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">BookingBio</h1>
              </div>
              <h2 style="color: #1f2937;">Hola${admin.name ? `, ${admin.name}` : ''}!</h2>
              <p style="color: #4b5563;">Recibimos una solicitud para restablecer tu contraseña. Tu contraseña temporal es:</p>
              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <p style="font-size: 28px; font-weight: bold; color: #059669; letter-spacing: 4px; margin: 0;">${tempPassword}</p>
              </div>
              <p style="color: #4b5563;">Ingresá con esta contraseña y el sistema te va a pedir que la cambies inmediatamente.</p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">Si no solicitaste este cambio, ignorá este email.</p>
            </div>
          `,
        }),
      });
      if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
      }
    }

    // IMPORTANTE: NO devolver temp_password en el response.
    // La contraseña se envía SOLO por email.
    // Si no hay RESEND_API_KEY configurado, la contraseña se pierde.
    return jsonSuccess({ sent: true });
  } catch (err) {
    console.error("admin-forgot-password error:", err);
    return jsonError("Error interno");
  }
});
