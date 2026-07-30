import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, phone, message } = await req.json();

    if (!name || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "Completá todos los campos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const ticketDate = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const ticketNum = `BK-${ticketDate}-${String(Math.floor(Math.random()*900)+100)}`;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
    const TO_EMAIL = Deno.env.get("TO_EMAIL") || "seremprendeads@gmail.com";

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Resend no configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `Soporte | BookingBio - [${ticketNum}]`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <div style="background: #059669; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Soporte BookingBio</h1>
            <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">Ticket #${ticketNum}</p>
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
    };

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!emailRes.ok) {
      const errorText = await emailRes.text();
      console.error("Resend error:", emailRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `Resend: ${emailRes.status} - ${errorText.slice(0, 200)}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent: true, ticket: ticketNum }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-support-email error:", err);
    return new Response(
      JSON.stringify({ error: `Error interno: ${err instanceof Error ? err.message : err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
