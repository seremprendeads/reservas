import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders, checkRateLimit } from "../_shared/auth.ts";
import { buscarPromo, normalizarCodigo, precioReserva, redondear, type PromoScope } from "../_shared/promo.ts";

// ============================================================================
// validate-promo (publica)
//
// El visitante pega un codigo en el carrito de la Tienda o en el pago de una
// Reserva. Esta funcion calcula el descuento SOBRE EL PRECIO REAL de la base y
// devuelve el resultado para mostrarlo. Es solo vista previa: el cobro real lo
// vuelve a calcular create-payment / create-shop-payment.
//
// Body: { business_slug, code, scope: 'shop' | 'reservas',
//         items?: [{ product_id, quantity }]   // shop
//         service_id?: string }                // reservas
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Limite bajo: evita probar codigos a fuerza bruta.
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = checkRateLimit(`validate-promo:${ip}`, 15, 60_000);
    if (!rl.allowed) return jsonError("Demasiados intentos, esperá un minuto", 429);

    const body = await req.json();
    const scope = body.scope as PromoScope;
    const codigo = normalizarCodigo(body.code);

    if (!body.business_slug || (scope !== "shop" && scope !== "reservas")) {
      return jsonError("Campos requeridos faltantes", 400);
    }
    if (!codigo) return jsonSuccess({ valid: false, message: "Ingresá un código" });

    const supabase = createServiceClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", body.business_slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!business) return jsonError("Negocio no encontrado", 404);

    // Base = precio real, nunca un numero que mande el navegador.
    let base = 0;
    if (scope === "shop") {
      const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
      const ids = items.map((i: { product_id: string }) => String(i.product_id));
      if (ids.length === 0) return jsonSuccess({ valid: false, message: "El carrito está vacío" });

      const { data: products } = await supabase
        .from("shop_products")
        .select("id, price, is_active")
        .eq("business_id", business.id)
        .in("id", ids);
      const precios = new Map((products || []).filter((p) => p.is_active).map((p) => [p.id, Number(p.price)]));

      for (const it of items) {
        const qty = Math.floor(Number(it.quantity));
        const precio = precios.get(String(it.product_id));
        if (precio === undefined || !Number.isFinite(qty) || qty < 1 || qty > 999) {
          return jsonSuccess({ valid: false, message: "Hay productos del carrito que ya no están disponibles" });
        }
        base += precio * qty;
      }
    } else {
      const { precio } = await precioReserva(supabase, business.id, body.service_id);
      if (!precio || precio <= 0) return jsonSuccess({ valid: false, message: "No se pudo determinar el precio" });
      base = Number(precio);
    }
    base = redondear(base);

    const r = await buscarPromo(supabase, business.id, codigo, scope, base);
    if (!r.ok) return jsonSuccess({ valid: false, message: r.error });

    return jsonSuccess({
      valid: true,
      code: r.promo.code,
      name: r.promo.name,
      discount_type: r.promo.discount_type,
      discount_value: r.promo.discount_value,
      base_amount: base,
      discount_amount: r.descuento,
      final_amount: r.final,
      free: r.final <= 0,
    });
  } catch (err) {
    console.error("validate-promo error:", err);
    return jsonError(err instanceof Error ? err.message : "Error interno");
  }
});
