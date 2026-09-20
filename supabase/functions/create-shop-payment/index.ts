import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";
import { descifrar } from "../_shared/crypto.ts";

// ============================================================================
// create-shop-payment
//
// ShopPage.tsx ya crea el pedido (shop_orders) y sus items (shop_order_items)
// directo con la anon key, con precios que vienen del carrito del cliente.
// Esta funcion es la que de verdad importa para la plata: recalcula el total
// a partir de shop_products.price (el precio real, no el que mando el
// navegador), valida que haya stock, y arma la preferencia de Mercado Pago
// con ese total recalculado — nunca con lo que vino del cliente.
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`create-shop-payment:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, intente más tarde", 429);
    }

    const body = await req.json();
    const { business_slug, order_id } = body;

    if (!business_slug || !order_id) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    const supabase = createServiceClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id, slug")
      .eq("slug", business_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!business) {
      return jsonError("Negocio no encontrado", 404);
    }

    const { data: order } = await supabase
      .from("shop_orders")
      .select("id, business_id, payment_status, customer_name, customer_email")
      .eq("id", order_id)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!order) {
      return jsonError("Pedido no encontrado", 404);
    }
    if (order.payment_status !== "pending") {
      return jsonError("Este pedido ya fue procesado", 400);
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from("shop_order_items")
      .select("id, product_id, product_name, quantity, selected_size")
      .eq("order_id", order_id);

    if (itemsError) throw itemsError;
    if (!orderItems || orderItems.length === 0) {
      return jsonError("El pedido no tiene productos", 400);
    }

    // Precio y stock SIEMPRE desde la tabla de productos, nunca desde lo que
    // ya quedo guardado en shop_order_items (eso lo cargo el cliente).
    const productIds = orderItems.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from("shop_products")
      .select("id, name, price, currency, stock, is_active")
      .eq("business_id", business.id)
      .in("id", productIds);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p) => [p.id, p]));
    let total = 0;
    const mpItems: { id: string; title: string; unit_price: number; quantity: number; currency_id: string }[] = [];

    for (const item of orderItems) {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_active) {
        return jsonError(`El producto "${item.product_name}" ya no está disponible`, 400);
      }
      if (product.stock < item.quantity) {
        return jsonError(`No hay stock suficiente de "${product.name}"`, 400);
      }
      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      mpItems.push({
        id: item.product_id,
        title: item.selected_size ? `${product.name} (${item.selected_size})` : product.name,
        unit_price: product.price,
        quantity: item.quantity,
        currency_id: product.currency || "ARS",
      });
    }

    // Deja el pedido con el total real, no el que calculo el navegador.
    await supabase.from("shop_orders").update({ total }).eq("id", order_id);

    const { data: mpConfig } = await supabase
      .from("payment_providers")
      .select("access_token")
      .eq("business_id", business.id)
      .eq("provider", "mercadopago")
      .eq("status", "connected")
      .maybeSingle();

    const tokenDelNegocio = await descifrar(mpConfig?.access_token);
    const MP_ACCESS_TOKEN = tokenDelNegocio || Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!MP_ACCESS_TOKEN) {
      return jsonError("Mercado Pago no configurado", 500);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const siteUrl = (Deno.env.get("SITE_URL") || req.headers.get("origin") || "").replace(/\/$/, "");
    const volverA = (estado: string) => `${siteUrl}/${business_slug}/tienda?pago=${estado}&pedido=${order_id}`;
    const notificationUrl = `${SUPABASE_URL}/functions/v1/mercadopago-webhook?negocio=${business.id}`;

    const preference = {
      items: mpItems,
      payer: {
        name: order.customer_name,
        email: order.customer_email,
      },
      ...(siteUrl
        ? {
            back_urls: { success: volverA("exito"), failure: volverA("error"), pending: volverA("pendiente") },
            auto_return: "approved",
          }
        : {}),
      notification_url: notificationUrl,
      external_reference: order_id,
      statement_descriptor: "TIENDA",
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

    await supabase.from("shop_orders").update({ preference_id: data.id }).eq("id", order_id);

    return jsonSuccess({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    });
  } catch (err) {
    console.error("create-shop-payment error:", err);
    return jsonError(err instanceof Error ? err.message : "Error interno");
  }
});
