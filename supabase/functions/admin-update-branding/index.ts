import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const { logo_url, title, subtitle, primary_color, background_color, card_bg_color, text_color, muted_color, caption_color, background_image_url, bg_opacity, overlay_color, header_color, header_opacity } = await req.json();

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("branding")
      .upsert({
        business_id: auth.businessId,
        logo_url: logo_url || "",
        title: title || "Reserva tu Turno",
        subtitle: subtitle || "Sistema de Reserva",
        primary_color: primary_color || "#059669",
        background_color: background_color || "#111827",
        card_bg_color: card_bg_color || "#1f2937",
        text_color: text_color || "#f3f4f6",
        muted_color: muted_color || "#9ca3af",
        caption_color: caption_color || "#9ca3af",
        background_image_url: background_image_url || "",
        bg_opacity: bg_opacity ?? 80,
        overlay_color: overlay_color || background_color || "#111827",
        header_color: header_color || card_bg_color || "#1f2937",
        header_opacity: header_opacity ?? 100,
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });

    if (error) throw error;

    return jsonSuccess();
  } catch (err) {
    console.error("admin-update-branding error:", err);
    return jsonError("Error interno");
  }
});
