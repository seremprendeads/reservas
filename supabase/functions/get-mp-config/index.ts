import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let businessSlug: string | null = null;

    // Support both GET (query param) and POST (body)
    if (req.method === "POST") {
      const body = await req.json();
      businessSlug = body.business_slug || null;
    } else {
      const url = new URL(req.url);
      businessSlug = url.searchParams.get("business_slug");
    }

    const supabase = createServiceClient();

    let publicKey: string | null = null;

    // If business_slug provided, try to get business-specific public key
    if (businessSlug) {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", businessSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (business) {
        const { data: mpConfig } = await supabase
          .from("payment_providers")
          .select("public_key")
          .eq("business_id", business.id)
          .eq("provider", "mercadopago")
          .eq("status", "connected")
          .maybeSingle();

        if (mpConfig?.public_key) {
          publicKey = mpConfig.public_key;
        }
      }
    }

    // Fallback to global env variable
    if (!publicKey) {
      publicKey = Deno.env.get("MERCADO_PAGO_PUBLIC_KEY") || Deno.env.get("MERCADOPAGO_PUBLIC_KEY");
    }

    if (!publicKey) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago public key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ publicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-mp-config error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
