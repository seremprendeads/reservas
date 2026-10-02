import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  try {
    console.log("[admin-save-bio] Request received");
    const auth = await authenticateToken(req);
    if ("error" in auth) {
      console.error("[admin-save-bio] Auth failed:", auth.error);
      return jsonError(`Auth failed: ${auth.error}`, 401);
    }
    console.log("[admin-save-bio] Auth OK, business:", auth.businessId);

    const body = await req.json().catch((e: unknown) => {
      console.error("[admin-save-bio] Body parse error:", String(e));
      return {};
    });
    console.log("[admin-save-bio] Action:", body.action);
    const supabase = createServiceClient();

    // ========================================================================
    // C.2 - Ownership de los links
    //
    // bio_links no tiene business_id: cuelga de bio_profiles via profile_id.
    // Esta funcion corre con service role (sin RLS), asi que filtrar solo por
    // el id del link no protege nada: cualquier admin con sesion valida podia
    // crear, editar, borrar o reordenar los links de OTRO negocio mandando un
    // profile_id o link_id ajeno.
    //
    // Se resuelve igual que en admin-update-bio: se resuelven primero los
    // perfiles del negocio autenticado y toda operacion sobre links se acota
    // a esos ids. El profile_id que manda el cliente nunca se toma como
    // autorizacion, solo como preferencia si pertenece al propio negocio.
    // ========================================================================
    const { data: perfilesPropios, error: errPerfiles } = await supabase
      .from("bio_profiles")
      .select("id")
      .eq("business_id", auth.businessId);
    if (errPerfiles) throw errPerfiles;
    const idsPropios: string[] = (perfilesPropios ?? []).map((p: { id: string }) => p.id);

    if (body.action === "save_profile") {
      const { profile_id, fields } = body;
      if (!profile_id || !fields) return jsonError("Missing profile_id or fields", 400);

      const { data: existing } = await supabase
        .from("bio_profiles")
        .select("*")
        .eq("id", profile_id)
        .eq("business_id", auth.businessId)
        .limit(1)
        .maybeSingle();

      let safeFields = fields;
      if (existing) {
        const existingCols = new Set(Object.keys(existing));
        safeFields = Object.fromEntries(
          Object.entries(fields).filter(([k]) => existingCols.has(k))
        );
      }

      const { error } = await supabase
        .from("bio_profiles")
        .update({ ...safeFields, updated_at: new Date().toISOString() })
        .eq("id", profile_id)
        .eq("business_id", auth.businessId);
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess({ ok: true });
    }

    if (body.action === "create_profile") {
      const { fields } = body;
      if (!fields) return jsonError("Missing fields", 400);

      const existingFields: Record<string, unknown> = {};
      const { data: probe } = await supabase.from("bio_profiles").select("*").limit(1).maybeSingle();
      if (probe) {
        const existingCols = new Set(Object.keys(probe));
        for (const [k, v] of Object.entries(fields)) {
          if (existingCols.has(k)) existingFields[k] = v;
        }
      } else {
        Object.assign(existingFields, fields);
      }

      const { data, error } = await supabase
        .from("bio_profiles")
        .insert({ ...existingFields, business_id: auth.businessId })
        .select()
        .single();
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess({ profile: data });
    }

    if (body.action === "save_slug") {
      const { profile_id, slug } = body;
      if (!profile_id || !slug) return jsonError("Missing profile_id or slug", 400);

      const { error } = await supabase
        .from("bio_profiles")
        .update({ slug, updated_at: new Date().toISOString() })
        .eq("id", profile_id)
        .eq("business_id", auth.businessId);
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess();
    }

    if (body.action === "add_link") {
      const { profile_id, title, url, icon, sort_order } = body;
      if (!profile_id || !title || !url) return jsonError("Missing required fields", 400);

      // El profile_id del cliente es solo una preferencia: si no pertenece al
      // negocio autenticado se ignora y se usa el perfil propio mas cercano.
      const profileIdFinal = idsPropios.includes(profile_id)
        ? profile_id
        : idsPropios[0];
      if (!profileIdFinal) {
        return jsonError("Todavía no tenés un perfil de bio creado.", 400);
      }

      const { data, error } = await supabase
        .from("bio_links")
        .insert({ profile_id: profileIdFinal, title, url, icon: icon || "link", sort_order: sort_order || 0 })
        .select()
        .single();
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess({ link: data });
    }

    if (body.action === "update_link") {
      const { link_id, fields } = body;
      if (!link_id || !fields) return jsonError("Missing link_id or fields", 400);

      // profile_id no se puede reasignar: mover un link a otro perfil (ni
      // siquiera ajeno) no debe ser parte de una edicion normal.
      const { profile_id: _noReasignar, ...camposDelLink } = fields as Record<string, unknown>;

      const { data, error } = await supabase
        .from("bio_links")
        .update(camposDelLink)
        .eq("id", link_id)
        .in("profile_id", idsPropios)
        .select("id");
      if (error) return jsonError(`DB error: ${error.message}`);
      // 0 filas = el link no existe o es de otro negocio. Se responde igual
      // en ambos casos para no revelar que ids ajenos existen.
      if (!data || data.length === 0) {
        return jsonError("Link no encontrado.", 404);
      }

      return jsonSuccess();
    }

    if (body.action === "delete_link") {
      const { link_id } = body;
      if (!link_id) return jsonError("Missing link_id", 400);

      const { data, error } = await supabase
        .from("bio_links")
        .delete()
        .eq("id", link_id)
        .in("profile_id", idsPropios)
        .select("id");
      if (error) return jsonError(`DB error: ${error.message}`);
      if (!data || data.length === 0) {
        return jsonError("Link no encontrado.", 404);
      }

      return jsonSuccess();
    }

    if (body.action === "reorder_links") {
      const { updates } = body;
      if (!updates || !Array.isArray(updates)) return jsonError("Missing updates array", 400);

      for (const u of updates) {
        const { error: errReorder } = await supabase
          .from("bio_links")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id)
          .in("profile_id", idsPropios);
        if (errReorder) return jsonError(`DB error: ${errReorder.message}`);
      }

      return jsonSuccess();
    }

    return jsonError("Unknown action: " + (body.action || "none"), 400);
  } catch (err) {
    console.error("admin-save-bio error:", err);
    return jsonError("Error: " + String(err));
  }
});
