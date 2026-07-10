import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, logo_url, title, subtitle, primary_color, background_color, card_bg_color, text_color, muted_color, background_image_url, bg_opacity } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: verified } = await supabase.rpc("verify_admin_password", {
      input_password: password,
      stored_hash: admin.password_hash,
    });

    if (!verified) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

      const { error } = await supabase
      .from("branding")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        logo_url: logo_url || "",
        title: title || "Reserva tu Turno",
        subtitle: subtitle || "Sistema de Reserva",
        primary_color: primary_color || "#059669",
        background_color: background_color || "#111827",
        card_bg_color: card_bg_color || "#1f2937",
        text_color: text_color || "#f3f4f6",
        muted_color: muted_color || "#9ca3af",
        background_image_url: background_image_url || "",
        bg_opacity: bg_opacity ?? 80,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-update-branding error:", err);
    return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
