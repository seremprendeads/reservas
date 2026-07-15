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
    const businessId = auth.businessId;

    const [membersRes, invitesRes] = await Promise.all([
      supabase.from("business_members").select("*").eq("business_id", businessId).order("created_at"),
      supabase.from("invite_tokens").select("*").eq("business_id", businessId).is("accepted_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
    ]);

    return jsonSuccess({
      success: true,
      members: membersRes.data || [],
      invites: invitesRes.data || [],
    });
  } catch (err) {
    console.error("admin-get-team error:", err);
    return jsonError("Error interno");
  }
});
