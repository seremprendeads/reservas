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

    const { booking_id } = await req.json();

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("bookings")
      .update({ deleted_at: null })
      .eq("id", booking_id)
      .eq("business_id", auth.businessId);

    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-restore-booking error:", err);
    return jsonError("Error interno");
  }
});
