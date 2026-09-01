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

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("business_id", auth.businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return jsonSuccess({ success: true, data });
  } catch (err) {
    console.error("admin-get-waiting-list error:", err);
    return jsonError("Error interno");
  }
});
