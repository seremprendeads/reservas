import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateToken,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  jsonAccessDenied,
  checkBioAccess,
  corsHeaders,
} from "../_shared/auth.ts";

// ============================================================================
// admin-get-bio-stats
//
// PROPUESTA FASE 2 (auditoria RLS H4): dar al panel de Bio las estadisticas de
// SU propio perfil sin abrir SELECT anonimo sobre bio_stats.
//
// POR QUE EXISTE:
//   BioAdmin.tsx (tab "stats") leia bio_stats con la anon key:
//     supabase.from('bio_stats').select('*').eq('profile_id', ...)
//   No existe policy de SELECT para anon en bio_stats -> RLS devuelve vacio y
//   la analitica del panel nunca mostro datos. Abrir SELECT anon expondria
//   metricas de TODOS los perfiles (no hay Supabase Auth para filtrar), asi que
//   la lectura pasa por una Edge Function con service_role.
//
// SEGURIDAD:
//   - El business_id NO viene del cliente: sale de authenticateToken() (JWT
//     propio verificado + relectura fresca de admin_users en la base).
//   - checkBioAccess() bloquea cuentas suspendidas. La bio esta disponible en
//     todos los planes (incluido free post-prueba), igual que admin-get-panel-data.
//   - No acepta NINGUN parametro del cliente: no se puede pedir las stats de
//     otro perfil. Si algun dia se agrega un profile_id/business_id al body, se
//     reabre el agujero.
//   - El cliente con la anon key sigue sin poder leer bio_stats (sin policy).
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      return jsonUnauthorized();
    }

    const businessId = auth.businessId;

    const access = await checkBioAccess(businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, access.reason);
    }

    const supabase = createServiceClient();

    const { data: profile, error: profileError } = await supabase
      .from("bio_profiles")
      .select("id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      // El negocio todavia no creo su perfil de bio: panel sin estadisticas.
      return jsonSuccess({ stats: [] });
    }

    // Misma ventana que usaba BioAdmin.tsx (ultimos 30 dias).
    const { data: stats, error: statsError } = await supabase
      .from("bio_stats")
      .select("id, profile_id, event_type, link_id, created_at")
      .eq("profile_id", profile.id)
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

    if (statsError) throw statsError;

    return jsonSuccess({ stats: stats ?? [] });
  } catch (err) {
    console.error("admin-get-bio-stats error:", err);
    return jsonError("Error interno");
  }
});