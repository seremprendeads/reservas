import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: "Email requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar que el email existe
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();

    if (!admin) {
      // Por seguridad, no revelamos si el email existe o no
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generar contraseña temporal
    const tempPassword = generateTempPassword();

    // Actualizar contraseña en la BD
    const { error: updateError } = await supabase.rpc("update_admin_password_direct", {
      p_email: email,
      p_new_password: tempPassword,
    });

    if (updateError) throw updateError;

    // Enviar email con Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "admin@seremprende.com";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "🔑 Tu contraseña temporal - Panel Admin",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <div style="background: #059669; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Panel de Administración</h1>
            </div>
            <h2 style="color: #1f2937;">Hola${admin.name ? `, ${admin.name}` : ''}!</h2>
            <p style="color: #4b5563;">Recibimos una solicitud para restablecer tu contraseña. Tu contraseña temporal es:</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="font-size: 28px; font-weight: bold; color: #059669; letter-spacing: 4px; margin: 0;">${tempPassword}</p>
            </div>
            <p style="color: #4b5563;">Ingresá con esta contraseña y <strong>cambiala inmediatamente</strong> desde la sección <strong>Mi perfil</strong>.</p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">Si no solicitaste este cambio, ignorá este email.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.text();
      console.error("Resend error:", errData);
      throw new Error("Error al enviar el email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});