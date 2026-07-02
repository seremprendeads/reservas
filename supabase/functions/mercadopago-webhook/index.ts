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
    const body = await req.json();

    // Mercado Pago manda tipo "payment" cuando se aprueba
    if (body.type !== "payment") {
      return new Response("OK", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response("No payment ID", { status: 200 });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    // Consultar el pago a Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    if (!mpRes.ok) {
      return new Response("MP API error", { status: 200 });
    }

    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const bookingCode = payment.external_reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Actualizar la reserva
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        payment_status: "approved",
        payment_id: String(paymentId),
        booking_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_code", bookingCode)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Notificación ntfy si está habilitada
    const ntfyTopic = Deno.env.get("NTFY_TOPIC");
    const ntfyEnabled = Deno.env.get("NTFY_ENABLED");

    if (ntfyTopic && ntfyEnabled === "true" && booking) {
      const fecha = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long"
      });
      const hora = booking.booking_time.slice(0, 5);

      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          "Title": "💰 Nueva reserva confirmada",
          "Priority": "high",
          "Tags": "white_check_mark,calendar",
          "Content-Type": "text/plain",
        },
        body: `Cliente: ${booking.customer_name}\nFecha: ${fecha}\nHora: ${hora} hs\nCódigo: ${bookingCode}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});