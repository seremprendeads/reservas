import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return jsonError("El nombre es requerido", 400);
    }

    const slug = slugify(name);
    if (!slug) {
      return jsonError("El nombre no genera un slug válido", 400);
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .neq("id", auth.businessId)
      .maybeSingle();

    if (existing) {
      return jsonError("Ese nombre de URL ya está en uso. Elegí otro.", 409);
    }

    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.businessId);

    if (error) throw error;

    return jsonSuccess({ slug });
  } catch (err) {
    console.error("admin-update-business error:", err);
    return jsonError("Error interno");
  }
});
