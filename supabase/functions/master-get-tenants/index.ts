import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateMaster, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateMaster(req);
    if ("error" in auth) return jsonUnauthorized();

    const supabase = createServiceClient();

    const { data: tenants, error } = await supabase
      .from("businesses")
      .select("id, name, slug, owner_email, is_active, plan, is_trial, trial_ends_at, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return jsonSuccess({ tenants: tenants || [] });
  } catch (err) {
    console.error("master-get-tenants error:", err);
    return jsonError("Error interno");
  }
});
