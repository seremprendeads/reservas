import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateMaster, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders, TRIAL_DAYS } from "../_shared/auth.ts";

// Planes válidos — DEBEN coincidir con el CHECK constraint de businesses.plan en la DB.
// free = Free Bio Standard · bio_pro = Bio Pro · bio_reservas = Bio Pro + Reservas
// bio_web = Bio Pro + Sitio web · bio_reservas_web = Bio Pro + Reservas + Sitio web
// bio_web_shop = Bio Pro + Sitio web + Tienda · enterprise = Todo completo · pro = anterior
const VALID_PLANS = ["free", "bio_pro", "bio_reservas", "bio_web", "bio_reservas_web", "bio_web_shop", "pro", "enterprise"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateMaster(req);
    if ("error" in auth) return jsonUnauthorized();

    const { business_id, action, plan, product_limit } = await req.json();

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
        // Extiende el trial TRIAL_DAYS días desde hoy (misma constante que auth.ts)
        const newEnd = new Date();
        newEnd.setDate(newEnd.getDate() + TRIAL_DAYS);
        updates = {
          is_trial: true,
          trial_ends_at: newEnd.toISOString(),
          is_active: true,
        };
        break;

      case "set_product_limit":
        // product_limit null/vacio = vuelve a usar el limite general del plan.
        if (product_limit !== null && product_limit !== undefined) {
          const n = Number(product_limit);
          if (!Number.isInteger(n) || n < 1) {
            return jsonError("product_limit debe ser un entero positivo o null", 400);
          }
          updates = { product_limit: n };
        } else {
          updates = { product_limit: null };
        }
        break;

      default:
        return jsonError("Acción inválida. Válidas: suspend, reactivate, change_plan, extend_trial, set_product_limit", 400);
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
