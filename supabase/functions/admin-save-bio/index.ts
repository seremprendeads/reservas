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

    if (body.action === "save_profile") {
      const { profile_id, fields } = body;
      if (!profile_id || !fields) return jsonError("Missing profile_id or fields", 400);

      const { data: existing } = await supabase
        .from("bio_profiles")
        .select("*")
        .eq("id", profile_id)
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

      const { data, error } = await supabase
        .from("bio_links")
        .insert({ profile_id, title, url, icon: icon || "link", sort_order: sort_order || 0 })
        .select()
        .single();
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess({ link: data });
    }

    if (body.action === "update_link") {
      const { link_id, fields } = body;
      if (!link_id || !fields) return jsonError("Missing link_id or fields", 400);

      const { error } = await supabase
        .from("bio_links")
        .update(fields)
        .eq("id", link_id);
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess();
    }

    if (body.action === "delete_link") {
      const { link_id } = body;
      if (!link_id) return jsonError("Missing link_id", 400);

      const { error } = await supabase
        .from("bio_links")
        .delete()
        .eq("id", link_id);
      if (error) return jsonError(`DB error: ${error.message}`);

      return jsonSuccess();
    }

    if (body.action === "reorder_links") {
      const { updates } = body;
      if (!updates || !Array.isArray(updates)) return jsonError("Missing updates array", 400);

      for (const u of updates) {
        await supabase.from("bio_links").update({ sort_order: u.sort_order }).eq("id", u.id);
      }

      return jsonSuccess();
    }

    return jsonError("Unknown action: " + (body.action || "none"), 400);
  } catch (err) {
    console.error("admin-save-bio error:", err);
    return jsonError("Error: " + String(err));
  }
});
