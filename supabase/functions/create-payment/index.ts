import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MP_ACCESS_TOKEN) {
      throw new Error("Mercado Pago access token not configured");
    }

    const body = await req.json();
    const { bookingCode, amount, email, name } = body;

    if (!bookingCode || !amount || !email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const successUrl = `${SUPABASE_URL}/functions/v1/payment-success?booking_code=${bookingCode}`;
    const failureUrl = `${SUPABASE_URL}/functions/v1/payment-failure?booking_code=${bookingCode}`;
    const pendingUrl = `${SUPABASE_URL}/functions/v1/payment-pending?booking_code=${bookingCode}`;
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mercadopago-webhook`;

    const preference = {
      items: [
        {
          id: bookingCode,
          title: `Reserva ${bookingCode}`,
          description: "Turno reservado",
          unit_price: amount,
          quantity: 1,
          currency_id: "ARS",
        },
      ],
      payer: {
        name: name,
        email: email,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
      notification_url: notificationUrl,
      external_reference: bookingCode,
      statement_descriptor: "RESERVA",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Mercado Pago error:", errorData);
      throw new Error(`Mercado Pago API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error creating payment preference:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
