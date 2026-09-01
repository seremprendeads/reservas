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

    const body = await req.json();
    const { shop_config } = body;

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("branding")
      .upsert({
        business_id: auth.businessId,
        shop_config: shop_config ?? null,
      }, { onConflict: "business_id" });

    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-shop-config error:", err);
    return jsonError("Error interno");
  }
});
