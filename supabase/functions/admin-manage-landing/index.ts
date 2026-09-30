import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateToken,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  jsonAccessDenied,
  checkBusinessAccess,
  corsHeaders,
} from "../_shared/auth.ts";

// ============================================================================
// admin-manage-landing
//
// Reemplaza las cinco operaciones que el panel hacia directo sobre
// landing_pages con la clave publica: leer, crear, actualizar y publicar.
//
// POR QUE EXISTE:
// Las reglas de la tabla solo verificaban que el negocio existiera y tuviera el
// modulo. No verificaban que quien escribe sea el duenio, porque sin identidad
// la base no tiene con que hacerlo. Es decir: cualquiera podia editar o borrar
// el sitio web de cualquier negocio.
//
// Acá el business_id sale de authenticateToken(), que valida la firma del JWT y
// relee admin_users en la base. Nunca se acepta un business_id del cliente.
//
// ACCIONES:
//   get      devuelve la landing del negocio (incluye borradores)
//   save     crea o actualiza el borrador
//   publish  guarda y marca como publicada
// ============================================================================

interface Payload {
  action?: string;
  sections?: unknown;
  theme?: unknown;
  template?: string;
  visible_sections?: string[];
  logo_url?: string | null;
  slug?: string;
}

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

    const access = await checkBusinessAccess(businessId, "landing");
    if (!access.allowed) {
      return jsonAccessDenied(access.message, access.reason);
    }

    const body: Payload = await req.json();
    const action = body.action || "get";

    const supabase = createServiceClient();

    // ── Leer ────────────────────────────────────────────────────────────────
    if (action === "get") {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return jsonSuccess({ success: true, landing: data ?? null });
    }

    if (action !== "save" && action !== "publish") {
      return jsonError("Acción inválida", 400);
    }

    // ── Guardar o publicar ──────────────────────────────────────────────────
    const { data: business } = await supabase
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .maybeSingle();

    const campos = {
      sections: body.sections ?? {},
      theme: body.theme ?? {},
      template: body.template ?? "creative",
      visible_sections: body.visible_sections ?? [],
      logo_url: body.logo_url || null,
      slug: body.slug || business?.slug || "",
      updated_at: new Date().toISOString(),
    };

    // La landing existente se busca por negocio, no por un id que mande el
    // cliente: asi no se puede escribir sobre la landing de otro.
    const { data: existente } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let landingId: string | null = existente?.id ?? null;

    if (landingId) {
      const { error } = await supabase
        .from("landing_pages")
        .update(campos)
        .eq("id", landingId)
        .eq("business_id", businessId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("landing_pages")
        .insert({ ...campos, business_id: businessId, status: "draft" })
        .select("id")
        .single();
      if (error) throw error;
      landingId = data.id;
    }

    if (action === "publish" && landingId) {
      const { error } = await supabase
        .from("landing_pages")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", landingId)
        .eq("business_id", businessId);
      if (error) throw error;
    }

    const { data: actualizada } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("id", landingId)
      .eq("business_id", businessId)
      .maybeSingle();

    return jsonSuccess({ success: true, id: landingId, landing: actualizada ?? null });
  } catch (err) {
    console.error("admin-manage-landing error:", err);
    return jsonError("Error interno");
  }
});