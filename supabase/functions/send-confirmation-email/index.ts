import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const body = await req.json();
    const { email, name, bookingCode, date, time } = body;

    if (!email || !name || !bookingCode || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate booking code exists in the database (prevents spam/forgery)
    const supabase = createServiceClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, customer_email, booking_date, booking_time")
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (!booking) {
      return new Response(
        JSON.stringify({ error: "Invalid booking code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!RESEND_API_KEY) {
      console.log("Email would be sent to:", email, { name, bookingCode, date, time });
      return new Response(
        JSON.stringify({ success: true, message: "Email logged (no API key configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmacion de Reserva</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0;">Reserva Confirmada</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 12px;">
          <p style="font-size: 18px; color: #1f2937;">Hola ${name},</p>
          <p style="color: #4b5563;">Tu reserva ha sido confirmada exitosamente.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0; color: #6b7280;">Codigo de reserva:</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10b981; font-family: monospace;">${bookingCode}</p>
          </div>

          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Fecha</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #1f2937;">${date}</p>
            </div>
            <div style="flex: 1; background: white; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Hora</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #1f2937;">${time}</p>
            </div>
          </div>

          <p style="color: #4b5563; font-size: 14px;">Por favor, presenta el codigo de reserva al llegar.</p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Este es un email automatico, por favor no responda.
        </p>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Reservas <noreply@reservasturnos.com>",
        to: email,
        subject: `Confirmacion de Reserva - ${bookingCode}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      throw new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error sending email:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
