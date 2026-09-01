import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBusinessAccess, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBusinessAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const { day_of_week, start_time, end_time, is_active } = await req.json();

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("availability_settings")
      .update({ start_time, end_time, is_active })
      .eq("business_id", auth.businessId)
      .eq("day_of_week", day_of_week);

    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-availability error:", err);
    return jsonError("Error interno");
  }
});
