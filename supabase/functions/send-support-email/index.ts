import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, jsonSuccess, jsonError } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, phone, message } = await req.json();

    if (!name || !phone || !message) {
      return jsonError("Completá todos los campos", 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@bookingbio.com";

    if (!RESEND_API_KEY) {
      return jsonError("Resend no configurado", 500);
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: "admin@soporte.com",
        replyTo: phone.includes("@") ? phone : undefined,
        subject: `Soporte BookingBio - ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
            <div style="background: #059669; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Soporte BookingBio</h1>
            </div>
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <p style="color: #4b5563; margin: 0 0 8px;"><strong>Nombre:</strong> ${name}</p>
              <p style="color: #4b5563; margin: 0 0 8px;"><strong>Celular:</strong> ${phone}</p>
              <p style="color: #4b5563; margin: 0;"><strong>Mensaje:</strong></p>
              <p style="color: #6b7280; margin-top: 4px; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Enviado desde el panel de administración
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const error = await emailRes.text();
      console.error("Resend error:", error);
      return jsonError("Error al enviar email");
    }

    return jsonSuccess({ sent: true });
  } catch (err) {
    console.error("send-support-email error:", err);
    return jsonError("Error interno");
  }
});
