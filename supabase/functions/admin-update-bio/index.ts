import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBioAccess, corsHeaders } from "../_shared/auth.ts";

// ============================================================================
// Respuesta de error "legible" para el frontend.
//
// Por qué no se usa jsonError() acá: jsonError devuelve HTTP 500, y
// supabase.functions.invoke manda toda respuesta no-2xx a `error`, dejando
// `data` en undefined. El frontend nunca llega a leer el mensaje.
// Devolviendo HTTP 200 con success:false, el frontend puede leer data.error
// y mostrárselo al cliente.
//
// Mismo criterio que ya se aplicó en admin-login para cuentas suspendidas.
// ============================================================================
function jsonFail(error: string, reason?: string) {
  return new Response(
    JSON.stringify({ success: false, error, reason: reason || "error" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Traduce errores de la base a un mensaje que el cliente pueda entender.
// El trigger bio_free_plan_link_limit (migración 20260901) lanza una excepción
// con texto fijo cuando un negocio en plan free intenta activar un 4º enlace.
function mensajeDeError(err: unknown): { error: string; reason: string } {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const texto = raw.toLowerCase();

  if (texto.includes("máximo 3 links activos") || texto.includes("maximo 3 links activos")) {
    return {
      error: "Llegaste al límite de 3 enlaces del plan gratuito. Pasá a Bio Pro para tener enlaces ilimitados.",
      reason: "free_plan_link_limit",
    };
  }

  // Slug de bio duplicado (unique violation)
  if (texto.includes("duplicate key") || texto.includes("23505")) {
    return {
      error: "Ese enlace de bio ya está en uso por otro negocio. Probá con otro.",
      reason: "slug_taken",
    };
  }

  return { error: "No se pudo guardar. Intentá de nuevo en unos segundos.", reason: "error" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBioAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const body = await req.json();
    const { action, profile, links, link, linkId } = body as {
      action?: string;
      profile?: Record<string, unknown>;
      links?: { id: string; title: string; url: string; icon?: string; color?: string; is_active: boolean; sort_order: number }[];
      link?: Record<string, unknown>;
      linkId?: string;
    };

    const supabase = createServiceClient();

    // ========================================================================
    // AISLAMIENTO ENTRE NEGOCIOS
    //
    // bio_links no tiene business_id: cuelga de bio_profiles via profile_id.
    // Antes, update/delete/reorder filtraban SOLO por el id del link, y add_link
    // tomaba el profile_id que mandaba el cliente. Como esta funcion corre con
    // service role (sin RLS), cualquier admin con sesion valida podia editar o
    // borrar los links de OTRO negocio mandando un id ajeno.
    //
    // Ahora toda operacion sobre links se restringe a los perfiles propios.
    // ========================================================================
    const { data: perfilesPropios, error: errPerfiles } = await supabase
      .from("bio_profiles")
      .select("id")
      .eq("business_id", auth.businessId);
    if (errPerfiles) throw errPerfiles;

    const idsPropios = (perfilesPropios ?? []).map((p: { id: string }) => p.id);

    // Acciones sobre links que requieren tener un perfil creado.
    const accionesDeLinks = ['save_links', 'add_link', 'update_link', 'delete_link', 'reorder_links'];
    if (accionesDeLinks.includes(action ?? '') && idsPropios.length === 0) {
      return jsonFail("Todavía no tenés un perfil de bio creado.", "no_profile");
    }

    if (action === 'save_profile' && profile) {
      const allowed = [
        'slug','name','description','avatar_url','city','whatsapp','email','website',
        'social_instagram','social_tiktok','social_facebook','social_youtube',
        'social_twitter','social_linkedin','social_icon_color',
        'primary_color','title_color','description_color',
        'bg_type','bg_solid_color','bg_gradient_from','bg_gradient_to',
        'bg_image_url','bg_opacity','button_style','button_shadow',
      ];
      const safe: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of allowed) {
        if (k in profile) safe[k] = profile[k];
      }
      const { error } = await supabase
        .from("bio_profiles")
        .update(safe)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else if (action === 'create_profile') {
      const { data, error } = await supabase
        .from("bio_profiles")
        .insert({ ...profile, business_id: auth.businessId, admin_email: auth.admin.email })
        .select()
        .single();
      if (error) throw error;
      return jsonSuccess({ profile: data });
    } else if (action === 'save_links' && links) {
      for (const l of links) {
        const { data, error } = await supabase
          .from("bio_links")
          .update({ title: l.title, url: l.url, icon: l.icon, color: l.color, is_active: l.is_active, sort_order: l.sort_order })
          .eq("id", l.id)
          .in("profile_id", idsPropios)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) return jsonFail("No se encontró el enlace.", "not_found");
      }
    } else if (action === 'add_link' && link) {
      // El profile_id que manda el cliente se ignora a proposito: siempre se usa
      // el perfil del negocio autenticado.
      const { profile_id: _ignorado, ...camposDelLink } = link as Record<string, unknown>;
      const { data, error } = await supabase
        .from("bio_links")
        .insert({ ...camposDelLink, profile_id: idsPropios[0] })
        .select()
        .single();
      if (error) throw error;
      return jsonSuccess({ link: data });
    } else if (action === 'update_link' && linkId && link) {
      const { profile_id: _noReasignar, ...camposDelLink } = link as Record<string, unknown>;
      const { data, error } = await supabase
        .from("bio_links")
        .update(camposDelLink)
        .eq("id", linkId)
        .in("profile_id", idsPropios)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) return jsonFail("No se encontró el enlace.", "not_found");
    } else if (action === 'delete_link' && linkId) {
      const { data, error } = await supabase
        .from("bio_links")
        .delete()
        .eq("id", linkId)
        .in("profile_id", idsPropios)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) return jsonFail("No se encontró el enlace.", "not_found");
    } else if (action === 'reorder_links' && links) {
      for (let i = 0; i < links.length; i++) {
        const { error } = await supabase
          .from("bio_links")
          .update({ sort_order: i })
          .eq("id", links[i].id)
          .in("profile_id", idsPropios);
        if (error) throw error;
      }
    } else {
      return jsonError("Acción no válida", 400);
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-bio error:", err);
    const { error, reason } = mensajeDeError(err);
    return jsonFail(error, reason);
  }
});
