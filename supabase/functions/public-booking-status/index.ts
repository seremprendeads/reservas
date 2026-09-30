import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createServiceClient,
  jsonSuccess,
  jsonError,
  corsHeaders,
} from "./_shared/auth.ts";

// ============================================================================
// public-booking-status
//
// Reemplaza la consulta que hacia la pantalla de pago con la anon key en
// Payment.checkPaymentStatus().
//
// POR QUE EXISTE:
// El cliente final, mientras paga, no tiene JWT. Si cerramos la lectura de
// bookings sin esto, la pantalla nunca se entera de que el pago se aprobo y se
// queda girando para siempre.
//
// QUE CAMBIA RESPECTO DE ANTES:
// La consulta vieja hacia select('*'), asi que devolvia la reserva entera
// -nombre, telefono, email, monto, notas internas- a cualquiera que tuviera el
// codigo. Acá se devuelve unicamente el estado del pago. Nada mas.
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { business_id, booking_code } = await req.json();

    if (!business_id || !booking_code) {
      return jsonError("Faltan datos de la reserva", 400);
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("bookings")
      .select("payment_status")
      .eq("business_id", business_id)
      .eq("booking_code", booking_code)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;

    return jsonSuccess({
      success: true,
      payment_status: data?.payment_status ?? null,
    });
  } catch (err) {
    console.error("public-booking-status error:", err);
    return jsonError("Error interno");
  }
});