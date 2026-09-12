import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";
import { descifrar } from "../_shared/crypto.ts";

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

    // El token está cifrado en la base (AES-GCM). Se descifra solo acá, en memoria.
    const tokenDelNegocio = await descifrar(mpConfig?.access_token);
    const MP_ACCESS_TOKEN = tokenDelNegocio || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MP_ACCESS_TOKEN) {
      return jsonError("Mercado Pago no configurado", 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    // Las back_urls apuntaban a /functions/v1/payment-success y similares, que
    // NO EXISTEN: el cliente terminaba en un 404 despues de pagar. Ahora vuelven
    // a la pagina de reservas del negocio, con el resultado en la query.
    const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/$/, "");
    const volverA = (estado: string) =>
      `${siteUrl}/${business_slug}/reservas?pago=${estado}&codigo=${bookingCode}`;
    const successUrl = volverA("exito");
    const failureUrl = volverA("error");
    const pendingUrl = volverA("pendiente");

    // El negocio viaja en la URL de notificacion: sin eso, el webhook no sabe
    // de quien es el pago y no puede elegir con que clave validar la firma.
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mercadopago-webhook?negocio=${business.id}`;

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
      // Si no se pudo determinar el dominio del sitio, se omiten las back_urls
      // y auto_return: Mercado Pago rechaza la preferencia entera si son invalidas.
      // Sin ellas el pago funciona igual, solo que no redirige al volver.
      ...(siteUrl
        ? {
            back_urls: { success: successUrl, failure: failureUrl, pending: pendingUrl },
            auto_return: "approved",
          }
        : {}),
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
