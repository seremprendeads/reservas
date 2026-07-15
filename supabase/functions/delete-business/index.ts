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
    const email = auth.admin.email;

    if (!business_id) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    // Must type the business name to confirm
    if (confirmation !== "ELIMINAR") {
      return jsonError('Debés escribir "ELIMINAR" para confirmar', 400);
    }

    const supabase = createServiceClient();

    // Verify user is owner of this business
    const { data: member } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", business_id)
      .eq("user_email", email)
      .maybeSingle();

    if (!member || member.role !== "owner") {
      return jsonError("Solo el propietario puede eliminar el negocio", 403);
    }

    // Get business name for confirmation
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
