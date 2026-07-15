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

    const { action, date, reason, id } = await req.json();

    const supabase = createServiceClient();

    if (action === "add") {
      const { error } = await supabase
        .from("blocked_dates")
        .insert({ business_id: auth.businessId, date, reason: reason || null });
      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-manage-blocked-dates error:", err);
    return jsonError("Error interno");
  }
});
