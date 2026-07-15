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
    
    let query = supabase.from("bookings").delete()
      .eq("business_id", auth.businessId)
      .not("deleted_at", "is", null);

    if (booking_id) {
      query = query.eq("id", booking_id);
    } else {
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      query = query.lt("deleted_at", threeWeeksAgo.toISOString());
    }

    const { error } = await query;
    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-purge-bookings error:", err);
    return jsonError("Error interno");
  }
});
