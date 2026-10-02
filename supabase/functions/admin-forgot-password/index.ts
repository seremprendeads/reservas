import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  // crypto.getRandomValues y no Math.random(): la contrasena temporal es una
  // credencial real, y Math.random no es criptograficamente seguro. Es
  // predecible a partir del estado interno, lo que reduce el espacio de
  // busqueda de una credencial que da acceso al panel.
  const pool = new Uint32Array(10);
  crypto.getRandomValues(pool);
  return Array.from(pool, (n) => chars[n % chars.length]).join('');
}

// Cierra el canal lateral de tiempo. Cuando el email no existe el handler
// termina al instante; cuando existe hace dos RPCs y un POST a Resend. Esa
// diferencia de latencia permite enumerar cuentas probando emails y midiendo
// la respuesta, aunque el body y el status sean identicos. Se nivela con una
// espera fija en el camino rapido (el lento ya excede el piso).
const MIN_RESPONSE_MS = 700;

async function respondGeneric(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((r) => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  }
  return jsonSuccess({ sent: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    // Rate limiting por IP: frena el envio masivo desde un mismo origen.
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

    // Rate limiting por email: frena el ataque dirigido a una victima concreta.
    // Sin esto, el limite por IP no sirve de nada: el atacante rota de IP o
    // espera un minuto entre cada intento y sigue pidiendo resets.
    //
    // Se devuelve la MISMA respuesta generica en vez de un 429. Un 429 aqui
    // solo para emails que existen seria un oraculo de enumeracion de cuentas
    // (y el cooldown aplicado despues de consultar admin_users lo seria
    // todavia mas). Devolviendo {sent:true} siempre, el atacante no puede
    // distinguir "te mandamos el mail" de "estas en cooldown" ni de
    // "ese email no existe".
    const emailRl = checkRateLimit(`admin-forgot-password:email:${cleanEmail}`, 3, 15 * 60_000);
    if (!emailRl.allowed) {
      return await respondGeneric(startedAt);
    }

    const supabase = createServiceClient();

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, name, email")
      .ilike("email", cleanEmail)
      .maybeSingle();

    // Respuesta generica si el email no existe (previene enumeracion de usuarios).
    // Pasa por respondGeneric para no delatar la diferencia de tiempo.
    if (!admin) {
      return await respondGeneric(startedAt);
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
          to: admin.email,
          subject: "🔑 Tu contraseña temporal - BiowebLink",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
              <div style="background: #059669; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">BiowebLink</h1>
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
        // Se registra solo el status, no el cuerpo de la respuesta: el body
        // de Resend puede devolver un eco de la request (destinatario y
        // contenido), y el contenido del mail lleva la contrasena temporal.
        console.error("admin-forgot-password: Resend respondio", emailRes.status);
      }
    }

    // IMPORTANTE: NO devolver temp_password en el response.
    // La contrasena se envia SOLO por email.
    // Si no hay RESEND_API_KEY configurado, la contrasena se pierde.
    return await respondGeneric(startedAt);
  } catch (err) {
    // Se registra solo el mensaje, no el objeto entero: los errores de
    // PostgREST pueden incluir parametros enviados, y entre ellos la
    // contrasena temporal.
    console.error("admin-forgot-password error:", err instanceof Error ? err.message : "unknown");
    return jsonError("Error interno");
  }
});
