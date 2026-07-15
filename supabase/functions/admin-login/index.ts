import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateAdmin, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";
import { signToken } from "../_shared/jwt.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return jsonError("Email y contraseña requeridos", 400);
    }

    const auth = await authenticateAdmin(email, password);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!jwtSecret) {
      return jsonError("JWT_SECRET no configurado", 500);
    }

    const token = await signToken(
      {
        sub: auth.admin.id,
        email: auth.admin.email,
        business_id: auth.businessId,
      },
      jwtSecret,
      24
    );

    const supabase = createServiceClient();

    // Check trial status
    const { data: biz } = await supabase
      .from("businesses")
      .select("trial_ends_at, is_trial")
      .eq("id", auth.businessId)
      .maybeSingle();

    const trialExpired = biz?.is_trial && biz?.trial_ends_at && new Date(biz.trial_ends_at) < new Date();
    const trialEndsAt = biz?.trial_ends_at || null;

    return jsonSuccess({
      success: true,
      name: auth.admin.name,
      business_id: auth.businessId,
      token,
      trial_ends_at: trialEndsAt,
      trial_expired: trialExpired,
    });
  } catch (err) {
    console.error("admin-login error:", err);
    return jsonError("Error interno");
  }
});
