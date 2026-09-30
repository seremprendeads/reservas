import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateToken,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  jsonAccessDenied,
  checkBioAccess,
  corsHeaders,
} from "./_shared/auth.ts";

// ============================================================================
// admin-get-panel-data
//
// Reemplaza las cinco lecturas directas que el panel hacia con la anon key en
// useAdminBookings.loadData():
//
//   bookings · availability_settings · blocked_dates · settings · branding
//
// POR QUE EXISTE:
// La policy "anon_read_bookings" permitia leer reservas de CUALQUIER negocio
// activo, porque sin Supabase Auth la base no tiene con que identificar al
// dueño. Acá el business_id NO viene del cliente: sale de authenticateToken(),
// que verifica la firma del JWT y despues relee admin_users en la base. Un
// token de otro negocio devuelve los datos de ESE otro negocio, nunca los de un
// business_id inventado en el body o en localStorage.
//
// IMPORTANTE: esta funcion NO acepta ningun business_id del cliente. Si algun
// dia alguien agrega ese parametro, vuelve a abrirse el agujero.
//
// ACCESO:
// Se usa checkBioAccess (no checkBusinessAccess) a proposito: el panel tambien
// lo carga una cuenta en plan free post-prueba, que sigue teniendo Bio y
// Configuracion de Cuenta. Lo unico que bloquea la carga es la suspension
// (is_active = false), que es la palanca comercial.
// ============================================================================

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

    const access = await checkBioAccess(businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, access.reason);
    }

    const supabase = createServiceClient();

    const [bookingsRes, availRes, blockedRes, settingsRes, brandingRes] =
      await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("business_id", businessId)
          .order("booking_date", { ascending: true }),
        supabase
          .from("availability_settings")
          .select("*")
          .eq("business_id", businessId)
          .order("day_of_week"),
        supabase
          .from("blocked_dates")
          .select("*")
          .eq("business_id", businessId)
          .order("date"),
        supabase
          .from("settings")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase
          .from("branding")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);

    if (bookingsRes.error) throw bookingsRes.error;
    if (availRes.error) throw availRes.error;
    if (blockedRes.error) throw blockedRes.error;

    return jsonSuccess({
      success: true,
      bookings: bookingsRes.data ?? [],
      availability: availRes.data ?? [],
      blocked_dates: blockedRes.data ?? [],
      settings: settingsRes.data ?? null,
      branding: brandingRes.data ?? null,
    });
  } catch (err) {
    console.error("admin-get-panel-data error:", err);
    return jsonError("Error interno");
  }
});