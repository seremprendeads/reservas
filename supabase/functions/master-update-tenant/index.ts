import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateMaster, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

// Planes válidos — deben coincidir con el enum del DB
const VALID_PLANS = ["free", "basic", "pro", "enterprise"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateMaster(req);
    if ("error" in auth) return jsonUnauthorized();

    const { business_id, action, plan } = await req.json();

    if (!business_id) return jsonError("business_id requerido", 400);

    const supabase = createServiceClient();

    // Verificar que el negocio existe antes de operar
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, is_active, plan, is_trial")
      .eq("id", business_id)
      .maybeSingle();

    if (!biz) return jsonError("Negocio no encontrado", 404);

    let updates: Record<string, unknown> = {};

    switch (action) {
      case "suspend":
        updates = { is_active: false };
        break;

      case "reactivate":
        updates = { is_active: true };
        break;

      case "change_plan":
        if (!plan || !VALID_PLANS.includes(plan)) {
          return jsonError(`Plan inválido. Válidos: ${VALID_PLANS.join(", ")}`, 400);
        }
        updates = {
          plan,
          is_trial: false,       // al cambiar plan manualmente, el trial termina
          is_active: true,       // reactivar si estaba suspendido
        };
        break;

      case "extend_trial":
        // Extiende el trial 18 días desde hoy
        const newEnd = new Date();
        newEnd.setDate(newEnd.getDate() + 18);
        updates = {
          is_trial: true,
          trial_ends_at: newEnd.toISOString(),
          is_active: true,
        };
        break;

      default:
        return jsonError("Acción inválida. Válidas: suspend, reactivate, change_plan, extend_trial", 400);
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", business_id);

    if (error) throw error;

    console.log(`Master ${auth.master.email} → action=${action} business_id=${business_id}`);

    return jsonSuccess({ success: true, action, business_id });
  } catch (err) {
    console.error("master-update-tenant error:", err);
    return jsonError("Error interno");
  }
});
