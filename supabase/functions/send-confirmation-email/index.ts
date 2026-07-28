import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const body = await req.json();
    const { email, name, bookingCode, date, time, serviceName, businessName } = body;

    if (!email || !name || !bookingCode || !date || !time) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SERVICE_NAME = serviceName || "Reserva";
    const BIZ_NAME = businessName || "";

    const dateMatch = date.match(/(\d{1,2})\s+de\s+(\w+)/);
    let dateISO = "";
    if (dateMatch) {
      const months: Record<string, string> = {
        enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
        julio: "07", agosto: "08", septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
      };
      const day = dateMatch[1].padStart(2, "0");
      const month = months[dateMatch[2]] || "01";
      const year = new Date().getFullYear();
      dateISO = `${year}-${month}-${day}`;
    }

    const timeClean = time.replace(" hs", "").trim();
    const [tH, tM] = timeClean.split(":").map(Number);
    const startDT = new Date(tH * 60 + tM);
    const endDT = new Date(startDT.getTime() + 60 * 60 * 1000);
    const fmtDT = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    };

    const gcalTitle = encodeURIComponent(`${SERVICE_NAME} - ${name}`);
    const gcalDetails = encodeURIComponent(`Reserva: ${bookingCode}\\nCliente: ${name}\\nServicio: ${SERVICE_NAME}${BIZ_NAME ? `\\nLugar: ${BIZ_NAME}` : ""}`);
    const gcalLocation = encodeURIComponent(BIZ_NAME || "");
    const gcalUrl = dateISO
      ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${dateISO.replace(/-/g, "")}T${String(tH).padStart(2, "0")}${String(tM).padStart(2, "0")}00/${dateISO.replace(/-/g, "")}T${String(tH + 1).padStart(2, "0")}${String(tM).padStart(2, "0")}00&details=${gcalDetails}&location=${gcalLocation}`
      : "#";

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BookingBio//Reserva//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${bookingCode}@bookingbio`,
      `DTSTART:${dateISO ? dateISO.replace(/-/g, "") : ""}T${String(tH).padStart(2, "0")}${String(tM).padStart(2, "0")}00`,
      `DTEND:${dateISO ? dateISO.replace(/-/g, "") : ""}T${String(tH + 1).padStart(2, "0")}${String(tM).padStart(2, "0")}00`,
      `SUMMARY:${SERVICE_NAME} - ${name}`,
      `DESCRIPTION:Reserva: ${bookingCode}\\nCliente: ${name}\\nServicio: ${SERVICE_NAME}${BIZ_NAME ? `\\nLugar: ${BIZ_NAME}` : ""}`,
      BIZ_NAME ? `LOCATION:${BIZ_NAME}` : "",
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const icsBase64 = btoa(unescape(encodeURIComponent(icsLines)));

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

          <div style="margin: 25px 0; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">Guarda tu turno en tu calendario:</p>
            <div style="display: inline-flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
              <a href="${gcalUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; background: #4285F4; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                &#128197; Agregar a Google Calendar
              </a>
              <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines)}" download="${SERVICE_NAME.replace(/[^a-zA-Z0-9]/g, "_")}.ics" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; background: #7C3AED; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                &#128197; Descargar archivo .ics
              </a>
            </div>
          </div>
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
