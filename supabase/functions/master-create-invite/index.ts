import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateMaster,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  corsHeaders,
  checkRateLimit,
} from "../_shared/auth.ts";

// Genera una contraseña temporal legible (sin caracteres ambiguos)
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// master-create-invite
//
// Crea en un solo paso:
//   1. El negocio (business) con trial de 18 días
//   2. El admin_user con contraseña temporal y must_change_password = true
//   3. El invite_token con el link de acceso
//
// Solo el Master Admin puede llamar esta función.
// El link resultante es: {SITE_URL}/invite/{token}
//
// Body esperado:
//   {
//     business_name: string,     // Nombre del negocio
//     business_slug?: string,    // Opcional; se genera desde business_name si no se envía
//     owner_email: string,       // Email del dueño del negocio
//     owner_name: string,        // Nombre del dueño
//     currency?: string,         // Default: ARS
//     timezone?: string,         // Default: America/Argentina/Buenos_Aires
//   }
//
// Respuesta:
//   {
//     success: true,
//     invite_link: string,       // Link completo para el cliente
//     business_id: string,
//     temp_password: string,     // Contraseña temporal — mostrar SOLO al master, NO al cliente por HTTP
//     token: string,
//     expires_at: string,        // ISO — el token expira en 7 días
//   }
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Rate limit: máx 20 invitaciones por minuto por IP (uso exclusivo del master)
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = checkRateLimit(`master-create-invite:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return jsonError("Demasiadas solicitudes, esperá un momento.", 429);
    }

    // Solo el Master Admin puede crear invitaciones
    const auth = await authenticateMaster(req);
    if ("error" in auth) return jsonUnauthorized();

    const body = await req.json();
    const {
      business_name,
      business_slug,
      owner_email,
      owner_name,
      currency = "ARS",
      timezone = "America/Argentina/Buenos_Aires",
    } = body;

    // Validaciones básicas
    if (!business_name?.trim()) {
      return jsonError("Nombre del negocio requerido", 400);
    }
    if (!owner_email?.trim() || !owner_email.includes("@")) {
      return jsonError("Email del dueño inválido", 400);
    }
    if (!owner_name?.trim()) {
      return jsonError("Nombre del dueño requerido", 400);
    }

    const cleanEmail = owner_email.trim().toLowerCase();
    const cleanSlug = business_slug?.trim()
      ? slugify(business_slug.trim())
      : slugify(business_name.trim());

    if (cleanSlug.length < 3) {
      return jsonError("El slug del negocio debe tener al menos 3 caracteres", 400);
    }

    const supabase = createServiceClient();

    // Verificar que el email no esté ya registrado
    const { data: existingAdmin } = await supabase
      .from("admin_users")
      .select("id")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingAdmin) {
      return jsonError("Ya existe un admin con ese email", 400);
    }

    // Verificar que el slug no esté tomado
    const { data: existingSlug } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (existingSlug) {
      return jsonError(
        `El slug "${cleanSlug}" ya está en uso. Probá con un slug diferente.`,
        400
      );
    }

    // 1. Crear el negocio (el trigger set_trial_end_date asigna 18 días automáticamente)
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: business_name.trim(),
        slug: cleanSlug,
        owner_email: cleanEmail,
        currency,
        timezone,
        plan: "free",         // Empieza en free; el trial se activa via is_trial=true del trigger
        is_trial: true,       // El trigger también lo setea, pero lo explicitamos
      })
      .select("id, slug, trial_ends_at")
      .single();

    if (bizError) throw bizError;

    // 2. Generar contraseña temporal y crear admin con must_change_password = true
    const tempPassword = generateTempPassword();

    const { data: adminId, error: adminError } = await supabase.rpc(
      "create_invited_admin",
      {
        p_email: cleanEmail,
        p_temp_password: tempPassword,
        p_name: owner_name.trim(),
        p_business_id: business.id,
      }
    );

    if (adminError) throw adminError;

    // 3. Crear branding por defecto
    await supabase.from("branding").insert({
      business_id: business.id,
      title: business_name.trim(),
      subtitle: "Sistema de Reserva",
      primary_color: "#059669",
      background_color: "#111827",
      card_bg_color: "#1f2937",
      text_color: "#ffffff",
      muted_color: "#e6e6e6",
      caption_color: "#e6e6e6",
    });

    // 4. Crear settings por defecto
    await supabase.from("settings").insert({
      business_id: business.id,
      slot_duration_minutes: 30,
      price: 0,
      currency,
    });

    // 5. Generar invite token (UUID aleatorio + timestamp para unicidad)
    const tokenRaw = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
    const token = tokenRaw.slice(0, 32); // 32 chars hexadecimales + alphanum

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token válido 7 días

    const { error: tokenError } = await supabase.from("invite_tokens").insert({
      business_id: business.id,
      email: cleanEmail,
      role: "admin",
      token,
      invited_by: auth.master.email,
      expires_at: expiresAt.toISOString(),
    });

    if (tokenError) throw tokenError;

    const SITE_URL =
      Deno.env.get("SITE_URL") || "https://reservas-two-sigma.vercel.app";
    const inviteLink = `${SITE_URL}/invite/${token}`;

    console.log(
      `Master ${auth.master.email} → created business ${business.id} (${cleanSlug}) for ${cleanEmail}`
    );

    // NOTA DE SEGURIDAD:
    // temp_password se devuelve en el response SOLO porque este endpoint
    // es exclusivo del Master Admin (autenticado con MASTER_JWT_SECRET).
    // El Master Admin ve la contraseña en su dashboard para poder comunicársela
    // al cliente en persona (modelo de venta presencial).
    // Esta contraseña se invalida cuando el cliente hace el cambio obligatorio.
    // El cliente NO recibe la contraseña por HTTP — solo la ve el Master Admin.
    return jsonSuccess({
      invite_link: inviteLink,
      business_id: business.id,
      slug: cleanSlug,
      trial_ends_at: business.trial_ends_at,
      temp_password: tempPassword,
      token,
      expires_at: expiresAt.toISOString(),
      admin_id: adminId,
    });
  } catch (err) {
    console.error("master-create-invite error:", err);
    return jsonError("Error interno al crear la invitación");
  }
});
