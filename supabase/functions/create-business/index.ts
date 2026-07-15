import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

    const { name, slug, currency, timezone } = await req.json();
    const email = auth.admin.email;

    if (!name || !slug) {
      return jsonError("Campos requeridos faltantes", 400);
    }

    const supabase = createServiceClient();

    // Check if admin already has a business
    const { data: existingAdmin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", auth.admin.id)
      .not("business_id", "is", null)
      .maybeSingle();

    if (existingAdmin) {
      return jsonError("Ya tenés un negocio asociado", 400);
    }

    const cleanSlug = slugify(slug);
    if (cleanSlug.length < 3) {
      return jsonError("El slug debe tener al menos 3 caracteres", 400);
    }

    const { data: existingSlug } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingSlug) {
      return jsonError("Ese nombre de URL ya está en uso", 400);
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        owner_email: email,
        currency: currency || "ARS",
        timezone: timezone || "America/Argentina/Buenos_Aires",
      })
      .select("id")
      .single();

    if (bizError) throw bizError;

    // Update admin_users with business_id
    await supabase
      .from("admin_users")
      .update({ business_id: business.id })
      .eq("id", auth.admin.id);

    // Create default settings
    await supabase.from("settings").insert({
      business_id: business.id,
      slot_duration: 30,
      max_advance_days: 60,
      min_advance_hours: 1,
      cancellation_policy: "Sin política de cancelación",
    });

    // Create default branding
    await supabase.from("branding").insert({
      business_id: business.id,
      title: name.trim(),
      subtitle: "Sistema de Reserva",
      primary_color: "#059669",
      background_color: "#111827",
      card_bg_color: "#1f2937",
      text_color: "#f3f4f6",
    });

    return jsonSuccess({
      message: "Negocio creado",
      business_id: business.id,
      slug: cleanSlug,
    });
  } catch (err) {
    console.error("create-business error:", err);
    return jsonError("Error interno");
  }
});
