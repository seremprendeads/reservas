import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createServiceClient,
  jsonSuccess,
  jsonError,
  corsHeaders,
  checkRateLimit,
} from "../_shared/auth.ts";

// ============================================================================
// accept-invite
//
// Endpoint público (sin auth) que el cliente llama al abrir el link de invitación.
// Valida el token y devuelve la información necesaria para el primer login.
//
// GET  /accept-invite?token={token}  → verifica si el token es válido
// POST /accept-invite               → { token } → marca como aceptado (sin body extra;
//                                     el primer login real se hace via admin-login)
//
// El flujo completo del cliente es:
//   1. Abrir link → GET /accept-invite?token={token}
//      → Respuesta: { valid: true, email, business_name, expires_at }
//   2. Frontend muestra pantalla de primer acceso con las instrucciones
//   3. El cliente hace login via admin-login con su email + temp_password
//   4. admin-login devuelve must_change_password = true
//   5. Frontend fuerza el cambio de contraseña
//   6. POST /accept-invite con el token → marca accepted_at
//      (esto es cosmético; el cambio de contraseña es el evento real)
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Rate limit: 30 verificaciones por minuto por IP
  const rl = checkRateLimit(`accept-invite:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return jsonError("Demasiadas solicitudes, esperá un momento.", 429);
  }

  const supabase = createServiceClient();

  // ── GET: verificar token ──────────────────────────────────────────────────
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token || token.length < 8) {
      return jsonError("Token inválido", 400);
    }

    const { data: invite, error } = await supabase
      .from("invite_tokens")
      .select(
        "id, email, role, expires_at, accepted_at, business_id, businesses(name, slug)"
      )
      .eq("token", token)
      .maybeSingle();

    if (error || !invite) {
      return jsonError("Invitación no encontrada", 404);
    }

    if (invite.accepted_at) {
      return jsonError(
        "Esta invitación ya fue utilizada. Si sos el dueño del negocio, iniciá sesión normalmente.",
        409
      );
    }

    if (new Date(invite.expires_at) <= new Date()) {
      return jsonError(
        "Esta invitación venció. Contactá a BookingBio para obtener una nueva.",
        410
      );
    }

    const biz = invite.businesses as unknown as { name: string; slug: string } | null;

    return jsonSuccess({
      valid: true,
      email: invite.email,
      business_name: biz?.name || "",
      business_slug: biz?.slug || "",
      expires_at: invite.expires_at,
    });
  }

  // ── POST: marcar como aceptado ────────────────────────────────────────────
  if (req.method === "POST") {
    const body = await req.json();
    const { token } = body;

    if (!token || token.length < 8) {
      return jsonError("Token requerido", 400);
    }

    const { data: invite } = await supabase
      .from("invite_tokens")
      .select("id, accepted_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return jsonError("Invitación no encontrada", 404);
    }

    // Ya aceptada → ok (idempotente)
    if (invite.accepted_at) {
      return jsonSuccess({ accepted: true });
    }

    if (new Date(invite.expires_at) <= new Date()) {
      return jsonError("Invitación vencida", 410);
    }

    const { error } = await supabase
      .from("invite_tokens")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (error) throw error;

    return jsonSuccess({ accepted: true });
  }

  return jsonError("Método no permitido", 405);
});
