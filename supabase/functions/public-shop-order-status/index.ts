import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";

// ============================================================================
// public-shop-order-status
//
// ShopPage.tsx necesita saber si UN pedido puntual (el que el propio
// comprador acaba de crear) ya se marco como pagado, para cerrar el
// checkout solo. Antes esto leia shop_orders directo con la anon key
// (select('payment_status').eq('id', orderId)) — la unica proteccion era
// una policy de SELECT que en realidad exponia TODOS los pedidos de TODOS
// los negocios (ver migracion 20260921020000). Esta funcion devuelve
// unicamente el estado de UN pedido puntual, nunca la lista completa.
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`public-shop-order-status:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, esperá un momento.", 429);
    }

    const { order_id, business_id } = await req.json();
    if (!order_id || !business_id) {
      return jsonError("order_id y business_id requeridos", 400);
    }

    const supabase = createServiceClient();
    const { data: order, error } = await supabase
      .from("shop_orders")
      .select("payment_status")
      .eq("id", order_id)
      .eq("business_id", business_id)
      .maybeSingle();

    if (error) throw error;
    if (!order) return jsonError("Pedido no encontrado", 404);

    return jsonSuccess({ success: true, payment_status: order.payment_status });
  } catch (err) {
    console.error("public-shop-order-status error:", err);
    return jsonError("Error interno");
  }
});
