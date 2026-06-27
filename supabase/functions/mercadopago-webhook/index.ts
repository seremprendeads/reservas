import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Handle different notification types
    if (body.type === "payment") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        throw new Error("No payment ID in notification");
      }

      // Get payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      const bookingCode = payment.external_reference;
      const status = payment.status;

      if (!bookingCode) {
        throw new Error("No external_reference in payment");
      }

      // Map Mercado Pago status to our status
      let paymentStatus: string;
      let bookingStatus: string;

      switch (status) {
        case "approved":
          paymentStatus = "approved";
          bookingStatus = "confirmed";
          break;
        case "pending":
        case "in_process":
        case "in_mediation":
          paymentStatus = "pending";
          bookingStatus = "pending";
          break;
        case "rejected":
        case "cancelled":
        case "refunded":
        case "charged_back":
          paymentStatus = "rejected";
          bookingStatus = "cancelled";
          break;
        default:
          paymentStatus = "pending";
          bookingStatus = "pending";
      }

      // Update booking in database
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          payment_id: paymentId.toString(),
          booking_status: bookingStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("booking_code", bookingCode);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        throw updateError;
      }

      console.log(`Booking ${bookingCode} updated: payment=${paymentStatus}, booking=${bookingStatus}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
