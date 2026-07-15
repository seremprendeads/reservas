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

    // Verify webhook signature — REQUIRED, never accept without it
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("MP_WEBHOOK_SECRET not configured — rejecting webhook");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const signatureHeader = req.headers.get("x-signature");
    const isValid = await verifyMpSignature(bodyText, signatureHeader, webhookSecret);
    if (!isValid) {
      console.error("Invalid MP webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the booking to get business_id
    const bookingCode = body.data?.id ? null : null; // will be set after payment lookup

    // First: look up the booking from external_reference in the payment
    // But we need the MP token to fetch the payment first.
    // We can't look up the booking without the payment details,
    // so we need to find the business first.
    // Strategy: fetch payment with each business's token until we find a match,
    // or use the payment_id to find the booking directly.

    // Actually: the payment external_reference contains the booking code.
    // We need to fetch the payment to get external_reference.
    // But we need a valid MP token to do that.

    // Solution: look up all connected MP providers and try each token
    const { data: providers } = await supabase
      .from("payment_providers")
      .select("business_id, access_token")
      .eq("provider", "mercadopago")
      .eq("status", "connected");

    if (!providers || providers.length === 0) {
      console.error("No connected MP providers found");
      return new Response("No MP providers", { status: 200 });
    }

    let payment: Record<string, unknown> | null = null;
    let matchedBusinessId: string | null = null;

    for (const prov of providers) {
      if (!prov.access_token) continue;
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${prov.access_token}` },
      });
      if (res.ok) {
        payment = await res.json();
        matchedBusinessId = prov.business_id;
        break;
      }
    }

    if (!payment || !matchedBusinessId) {
      console.error("Could not fetch payment from MP API");
      return new Response("Payment fetch failed", { status: 200 });
    }

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const extRef = payment.external_reference as string;
    if (!extRef) {
      return new Response("No external reference", { status: 200 });
    }

    // Find the booking
    const { data: existingBooking, error: findError } = await supabase
      .from("bookings")
      .select("id, business_id, booking_date, booking_time, customer_name, booking_code, payment_status")
      .eq("booking_code", extRef)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingBooking) {
      console.error("Booking not found for code:", extRef);
      return new Response("Booking not found", { status: 200 });
    }

    const businessId = existingBooking.business_id;

    // Idempotency: skip if already processed
    if (existingBooking.payment_status === "approved") {
      return new Response("Already processed", { status: 200 });
    }

    // Verify the payment belongs to this business
    if (matchedBusinessId !== businessId) {
      console.error("Payment business mismatch:", matchedBusinessId, "!=", businessId);
      return new Response("Business mismatch", { status: 200 });
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
      .eq("booking_code", extRef)
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
            "Title": "Nueva reserva confirmada",
            "Priority": "high",
            "Tags": "white_check_mark,calendar",
            "Content-Type": "text/plain",
          },
          body: `Cliente: ${booking.customer_name}\nFecha: ${fecha}\nHora: ${hora} hs\nCodigo: ${extRef}`,
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
