import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const { booking_id, booking_status, notas_admin } = await req.json();

    const supabase = createServiceClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (booking_status !== undefined) updates.booking_status = booking_status;
    if (notas_admin !== undefined) updates.notas_admin = notas_admin;

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", booking_id)
      .eq("business_id", auth.businessId);

    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-booking error:", err);
    return jsonError("Error interno");
  }
});
