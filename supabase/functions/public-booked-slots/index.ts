import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createServiceClient,
  jsonSuccess,
  jsonError,
  corsHeaders,
} from "./_shared/auth.ts";

// ============================================================================
// public-booked-slots
//
// Reemplaza la consulta que hacia la pagina publica de reservas con la anon key
// en Calendar.loadData(), para saber que horarios ya estan tomados.
//
// POR QUE EXISTE:
// Es un visitante anonimo: no tiene JWT ni puede tenerlo. Si simplemente
// cerramos la lectura de bookings, la pagina de reservas del cliente final deja
// de funcionar. Por eso hace falta esta puerta publica, pero angosta.
//
// QUE DEVUELVE:
// Solo fecha y hora ocupadas. Nada de nombre, telefono, email, monto ni codigo
// de reserva. Aunque alguien llame a esta funcion a mano con el id de otro
// negocio, lo unico que obtiene son horarios ocupados, que de todos modos ya se
// ven en el calendario publico de ese negocio.
//
// Valida ademas que el negocio exista y este activo: un negocio suspendido no
// devuelve horarios.
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { business_id } = await req.json();

    if (!business_id) {
      return jsonError("Falta el negocio", 400);
    }

    const supabase = createServiceClient();

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, is_active")
      .eq("id", business_id)
      .maybeSingle();

    if (!biz || !biz.is_active) {
      // Sin datos, sin explicar por que: no confirmamos ni desmentimos que el
      // negocio exista.
      return jsonSuccess({ success: true, slots: [] });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("bookings")
      .select("booking_date, booking_time")
      .eq("business_id", business_id)
      .is("deleted_at", null)
      .gte("booking_date", today)
      .in("booking_status", ["confirmed", "pending"]);

    if (error) throw error;

    return jsonSuccess({
      success: true,
      slots: (data ?? []).map((b) => ({
        booking_date: b.booking_date,
        booking_time: b.booking_time,
      })),
    });
  } catch (err) {
    console.error("public-booked-slots error:", err);
    return jsonError("Error interno");
  }
});