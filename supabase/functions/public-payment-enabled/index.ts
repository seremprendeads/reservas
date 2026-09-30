import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createServiceClient,
  jsonSuccess,
  jsonError,
  corsHeaders,
} from "./_shared/auth.ts";

// ============================================================================
// public-payment-enabled
//
// Le dice a la pagina publica de reservas si ESTE negocio tiene Mercado Pago
// conectado, para decidir si muestra la pantalla de pago o manda la reserva
// directo a confirmacion, en estado pendiente.
//
// ESTRICTO POR NEGOCIO, A PROPOSITO:
// get-mp-config tiene un respaldo con la clave global de la plataforma. Para
// saber "si mostrar el paso de pago" ese respaldo no sirve: haria que un
// profesional sin Mercado Pago cobre en la cuenta de la plataforma. Acá se
// consulta unicamente payment_providers del negocio, sin respaldo de ningun
// tipo.
//
// No devuelve claves ni tokens: solo true o false.
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { business_slug } = await req.json();

    if (!business_slug) {
      return jsonError("Falta el negocio", 400);
    }

    const supabase = createServiceClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", business_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!business) {
      return jsonSuccess({ success: true, enabled: false });
    }

    const { data: mp } = await supabase
      .from("payment_providers")
      .select("id")
      .eq("business_id", business.id)
      .eq("provider", "mercadopago")
      .eq("status", "connected")
      .maybeSingle();

    return jsonSuccess({ success: true, enabled: !!mp });
  } catch (err) {
    console.error("public-payment-enabled error:", err);
    // Ante un error, decimos que no hay pago online: es preferible que el turno
    // quede pendiente a que el cliente se trabe en una pantalla de pago rota.
    return jsonSuccess({ success: true, enabled: false });
  }
});