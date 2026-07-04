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
    const { email, password, booking_id, booking_status, notas_admin } = await req.json();

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

    // Construir objeto de actualización dinámicamente
    const updates: any = { updated_at: new Date().toISOString() };
    if (booking_status !== undefined) updates.booking_status = booking_status;
    if (notas_admin !== undefined) updates.notas_admin = notas_admin;

    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", booking_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});