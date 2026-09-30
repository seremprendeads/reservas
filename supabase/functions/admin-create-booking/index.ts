import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateToken,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  jsonAccessDenied,
  checkBusinessAccess,
  corsHeaders,
} from "./_shared/auth.ts";

// ============================================================================
// admin-create-booking
//
// Reemplaza el insert directo que hacia el panel con la anon key en
// CalendarPage.handleSaveBooking() (el admin cargando un turno a mano).
//
// POR QUE EXISTE:
// Ese insert terminaba con .select('id'), y ese select necesita permiso de
// lectura sobre bookings. Mientras exista, no se puede borrar la policy
// "anon_read_bookings" sin romper la carga manual de turnos.
//
// El business_id sale del JWT via authenticateToken(), nunca del cliente.
// El booking_code se genera en el servidor, con el mismo formato que usaba el
// panel (CAL-XXXXXXXX) para no cambiar nada de lo que ya ves en pantalla.
//
// ACCESO:
// Acá sí se usa checkBusinessAccess con el modulo 'reservas': cargar un turno
// es funcionalidad del modulo de reservas, y una cuenta en free post-prueba no
// debe poder hacerlo. En prueba vigente pasa, porque la prueba da acceso a todo.
// ============================================================================

interface BookingInput {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  booking_date?: string;
  booking_time?: string;
  amount?: number;
  notas_admin?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const businessId = auth.businessId;

    const access = await checkBusinessAccess(businessId, "reservas");
    if (!access.allowed) {
      return jsonAccessDenied(access.message, access.reason);
    }

    const body: BookingInput = await req.json();

    const bookingDate = (body.booking_date || "").trim();
    const bookingTime = (body.booking_time || "").trim();

    if (!bookingDate) {
      return jsonError("Falta la fecha del turno", 400);
    }
    if (!bookingTime) {
      return jsonError("Falta la hora del turno", 400);
    }

    const supabase = createServiceClient();

    const bookingCode = `CAL-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        business_id: businessId,
        booking_code: bookingCode,
        customer_name: (body.customer_name || "").trim(),
        customer_phone: (body.customer_phone || "").trim(),
        customer_email: (body.customer_email || "").trim(),
        booking_date: bookingDate,
        booking_time: bookingTime,
        payment_status: "pending",
        booking_status: "pending",
        amount: body.amount ?? 0,
        notas_admin: body.notas_admin ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return jsonSuccess({
      success: true,
      id: data.id,
      booking_code: bookingCode,
    });
  } catch (err) {
    console.error("admin-create-booking error:", err);
    return jsonError("Error interno");
  }
});