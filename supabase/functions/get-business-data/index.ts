import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, jsonSuccess, jsonError, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { business_slug, service_id } = await req.json();

    if (!business_slug) {
      return jsonError("business_slug requerido", 400);
    }

    const supabase = createServiceClient();

    // Get business by slug
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, currency")
      .eq("slug", business_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!business) {
      return jsonError("Negocio no encontrado", 404);
    }

    // Get settings for this business
    const { data: settings } = await supabase
      .from("settings")
      .select("price, currency")
      .eq("business_id", business.id)
      .maybeSingle();

    // Get services for this business
    const { data: services } = await supabase
      .from("services")
      .select("id, name, description, price, currency, duration_minutes, is_active")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("sort_order");

    // Get availability for this business
    const { data: availability } = await supabase
      .from("availability_settings")
      .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active")
      .eq("business_id", business.id)
      .order("day_of_week");

    // Get blocked dates for this business
    const { data: blockedDates } = await supabase
      .from("blocked_dates")
      .select("date, reason")
      .eq("business_id", business.id)
      .gte("date", new Date().toISOString().split('T')[0]);

    // Get branding for this business
    const { data: branding } = await supabase
      .from("branding")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle();

    return jsonSuccess({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
      },
      settings,
      services: services || [],
      availability: availability || [],
      blockedDates: blockedDates || [],
      branding,
    });
  } catch (err) {
    console.error("get-business-data error:", err);
    return jsonError("Error interno");
  }
});
