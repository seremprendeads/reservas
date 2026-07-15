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

    const { id, estado, notas, action } = await req.json();

    const supabase = createServiceClient();

    if (action === "delete") {
      const { error } = await supabase
        .from("waiting_list")
        .delete()
        .eq("id", id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (estado) updates.estado = estado;
      if (notas !== undefined) updates.notas = notas;

      const { error } = await supabase
        .from("waiting_list")
        .update(updates)
        .eq("id", id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-waiting-list error:", err);
    return jsonError("Error interno");
  }
});
