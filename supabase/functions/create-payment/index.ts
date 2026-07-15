import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limit: 10 requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`create-payment:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, intente más tarde", 429);
    }

    const body = await req.json();
    const { business_slug, bookingCode, amount, email, name, service_id } = body;

    if (!business_slug || !bookingCode || !amount || !email || !name) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    const supabase = createServiceClient();

    // Get business
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", business_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!business) {
      return jsonError("Negocio no encontrado", 404);
    }

    // Get MP credentials for this business
    const { data: mpConfig } = await supabase
      .from("payment_providers")
      .select("access_token")
      .eq("business_id", business.id)
      .eq("provider", "mercadopago")
      .eq("status", "connected")
      .maybeSingle();

    // Fallback to env variable if no business-specific config
    const MP_ACCESS_TOKEN = mpConfig?.access_token || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MP_ACCESS_TOKEN) {
      return jsonError("Mercado Pago no configurado", 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const successUrl = `${SUPABASE_URL}/functions/v1/payment-success?booking_code=${bookingCode}`;
    const failureUrl = `${SUPABASE_URL}/functions/v1/payment-failure?booking_code=${bookingCode}`;
    const pendingUrl = `${SUPABASE_URL}/functions/v1/payment-pending?booking_code=${bookingCode}`;
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mercadopago-webhook`;

    // Get service name and validate price if service_id provided
    let serviceName = "Turno reservado";
    let validAmount = amount;
    if (service_id) {
      const { data: service } = await supabase
        .from("services")
        .select("name, price, currency")
        .eq("id", service_id)
        .eq("business_id", business.id)
        .maybeSingle();
      if (service) {
        serviceName = service.name;
        // Use the price from DB instead of client-supplied amount (prevents price manipulation)
        validAmount = service.price;
      }
    }

    const preference = {
      items: [
        {
          id: bookingCode,
          title: `Reserva ${bookingCode} - ${serviceName}`,
          description: serviceName,
          unit_price: validAmount,
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
      return jsonError(`Mercado Pago API error: ${response.status}`, 502);
    }

    const data = await response.json();

    return jsonSuccess({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (err) {
    console.error("create-payment error:", err);
    return jsonError(err.message || "Error interno");
  }
});
