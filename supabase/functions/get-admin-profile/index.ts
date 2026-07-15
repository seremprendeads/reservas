import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("admin_users")
      .select("name, email, avatar_url")
      .eq("id", auth.admin.id)
      .maybeSingle();

    return jsonSuccess({ success: true, profile: profile || { name: auth.admin.name, email: auth.admin.email, avatar_url: null } });
  } catch (err) {
    console.error("get-admin-profile error:", err);
    return jsonError("Error interno");
  }
});
