import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const { business_id, confirmation } = await req.json();

    if (!business_id) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    if (confirmation !== "ELIMINAR") {
      return jsonError('Debés escribir "ELIMINAR" para confirmar', 400);
    }

    // Verify admin owns this business
    if (auth.businessId !== business_id) {
      return jsonError("No tenés permiso para eliminar este negocio", 403);
    }

    const supabase = createServiceClient();

    const { data: biz } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", business_id)
      .maybeSingle();

    // Clean up storage files
    const buckets = ["branding", "shop-images"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(business_id);
        if (files && files.length > 0) {
          const filePaths = files.map((f: { name: string }) => `${business_id}/${f.name}`);
          await supabase.storage.from(bucket).remove(filePaths);
        }
      } catch {
        // Storage bucket might not exist, continue
      }
    }

    // Delete the business (cascades to all related tables via FK)
    const { error: deleteError } = await supabase
      .from("businesses")
      .delete()
      .eq("id", business_id);

    if (deleteError) throw deleteError;

    // Remove business_id from admin_users that had this business
    await supabase
      .from("admin_users")
      .update({ business_id: null })
      .eq("business_id", business_id);

    return jsonSuccess({
      message: `Negocio "${biz?.name || business_id}" eliminado correctamente`,
    });
  } catch (err) {
    console.error("delete-business error:", err);
    return jsonError("Error interno");
  }
});
