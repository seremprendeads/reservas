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

    // Totales por estado
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, is_active, is_trial, trial_ends_at, plan, created_at");

    if (!businesses) return jsonError("Error al obtener datos", 500);

    const now = new Date();
    const stats = {
      total: businesses.length,
      active: 0,
      trial_active: 0,
      trial_expiring_soon: 0, // vence en ≤3 días
      suspended: 0,
      free_plan: 0,
      plans: {} as Record<string, number>,
      upcoming_expirations: [] as { id: string; trial_ends_at: string; days_left: number }[],
    };

    for (const b of businesses) {
      if (!b.is_active) {
        stats.suspended++;
        continue;
      }
      if (b.is_trial) {
        if (b.trial_ends_at) {
          const end = new Date(b.trial_ends_at);
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft > 0) {
            stats.trial_active++;
            if (daysLeft <= 3) {
              stats.trial_expiring_soon++;
              stats.upcoming_expirations.push({ id: b.id, trial_ends_at: b.trial_ends_at, days_left: daysLeft });
            }
          }
        } else {
          stats.trial_active++;
        }
      } else {
        stats.active++;
        if (b.plan === "free") stats.free_plan++;
      }
      const plan = b.plan || "free";
      stats.plans[plan] = (stats.plans[plan] || 0) + 1;
    }

    return jsonSuccess({ stats });
  } catch (err) {
    console.error("master-get-dashboard error:", err);
    return jsonError("Error interno");
  }
});
