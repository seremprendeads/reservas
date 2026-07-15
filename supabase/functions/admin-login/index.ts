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

    // Sign JWT token
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
      24 // 24 hours
    );

    // Get all businesses the user is a member of
    const supabase = createServiceClient();
    const { data: memberships } = await supabase
      .from("business_members")
      .select("business_id, role, businesses(id, name, slug, logo_url)")
      .eq("user_email", email)
      .eq("is_active", true);

    const businesses = (memberships || [])
      .map((m: Record<string, unknown>) => ({
        id: m.business_id,
        role: m.role,
        ...(m.businesses as Record<string, unknown>),
      }))
      .filter((b: Record<string, unknown>) => b.id);

    return jsonSuccess({
      success: true,
      name: auth.admin.name,
      business_id: auth.businessId,
      token,  // JWT token — store this, NOT the password
      businesses,
    });
  } catch (err) {
    console.error("admin-login error:", err);
    return jsonError("Error interno");
  }
});
