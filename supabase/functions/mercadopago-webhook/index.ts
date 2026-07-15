import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";

// Verify MercadoPago webhook signature (HMAC-SHA256)
async function verifyMpSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(";")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Check timestamp is within 5 minutes
  const diff = Math.abs(Date.now() - parseInt(ts));
  if (diff > 5 * 60 * 1000) return false;

  // Verify HMAC signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedV1 = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return v1 === expectedV1;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    if (body.type !== "payment") {
      return new Response("OK", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response("No payment ID", { status: 200 });
    }

    // Verify webhook signature if secret is configured
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signatureHeader = req.headers.get("x-signature");
      const isValid = await verifyMpSignature(bodyText, signatureHeader, webhookSecret);
      if (!isValid) {
        console.error("Invalid MP webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("WARNING: MP_WEBHOOK_SECRET not set — webhook signature not verified");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch payment details from MP API (this verifies the payment exists)
    // Use the business's own MP token (no global fallback for security)
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpConfig?.access_token}` },
    });

    if (!mpRes.ok) {
      console.error("MP API error:", mpRes.status);
      return new Response("MP API error", { status: 200 });
    }

    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const bookingCode = payment.external_reference;

    // Find the booking to get business_id
    const { data: existingBooking, error: findError } = await supabase
      .from("bookings")
      .select("id, business_id, booking_date, booking_time, customer_name, booking_code")
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingBooking) {
      console.error("Booking not found for code:", bookingCode);
      return new Response("Booking not found", { status: 200 });
    }

    const businessId = existingBooking.business_id;

    // Idempotency: skip if already processed
    if (existingBooking.payment_status === "approved") {
      return new Response("Already processed", { status: 200 });
    }

    // Look up the business's own MP access token
    const { data: mpConfig } = await supabase
      .from("payment_providers")
      .select("access_token")
      .eq("business_id", businessId)
      .eq("provider", "mercadopago")
      .eq("status", "connected")
      .maybeSingle();

    // If business has its own token, re-verify the payment with it
    if (mpConfig?.access_token && mpConfig.access_token !== globalMpToken) {
      const verifyRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpConfig.access_token}` },
      });
      if (verifyRes.ok) {
        const verifiedPayment = await verifyRes.json();
        if (verifiedPayment.status !== "approved") {
          return new Response("Payment not approved (business token)", { status: 200 });
        }
      }
    }

    // Update the booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        payment_status: "approved",
        payment_id: String(paymentId),
        booking_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_code", bookingCode)
      .eq("business_id", businessId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Send notification to business owner via ntfy
    if (booking) {
      const ntfyEnabled = Deno.env.get("NTFY_ENABLED");
      const ntfyTopic = Deno.env.get(`NTFY_TOPIC_${businessId.replace(/-/g, "_")}`)
        || Deno.env.get("NTFY_TOPIC");

      if (ntfyTopic && ntfyEnabled === "true") {
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
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
