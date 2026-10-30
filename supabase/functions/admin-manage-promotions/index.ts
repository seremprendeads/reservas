import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  authenticateToken,
  createServiceClient,
  jsonSuccess,
  jsonError,
  jsonUnauthorized,
  jsonAccessDenied,
  checkBusinessAccess,
  corsHeaders,
} from "../_shared/auth.ts";
import { normalizarCodigo } from "../_shared/promo.ts";

// ============================================================================
// admin-manage-promotions
//
// CRUD de promociones del negocio autenticado. Siempre filtra por el
// business_id del token: nunca confia en un business_id que mande el cliente.
//
// Mostrar en Bio: la Bio publica ya sabe dibujar un boton "promo" desde una
// fila de bio_links (icon 'promo:<etiqueta>', title = codigo, url = imagen).
// Cuando una promocion tiene show_in_bio, esta funcion sincroniza esa fila, asi
// BioPage no cambia y sigue leyendo solo datos publicos. Solo una promocion a
// la vez puede estar en la Bio.
// ============================================================================

const DEFAULT_BIO_LABEL = "Promociones y descuentos";
type Supabase = ReturnType<typeof createServiceClient>;

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function bioPerfilId(supabase: Supabase, businessId: string): Promise<string | null> {
  const { data } = await supabase.from("bio_profiles").select("id").eq("business_id", businessId).limit(1).maybeSingle();
  return data?.id ?? null;
}

async function bioFilaPromo(supabase: Supabase, perfilId: string): Promise<Row | null> {
  const { data } = await supabase
    .from("bio_links")
    .select("id, icon")
    .eq("profile_id", perfilId)
    .or("icon.eq.promo,icon.like.promo:%")
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

// Deja la Bio mostrando esta promocion. Devuelve false si no hay perfil de bio.
async function bioEncender(supabase: Supabase, businessId: string, promo: Row): Promise<boolean> {
  const perfilId = await bioPerfilId(supabase, businessId);
  if (!perfilId) return false;
  const campos = {
    title: promo.code,
    url: promo.image_url,
    icon: `promo:${(promo.bio_label || "").trim() || DEFAULT_BIO_LABEL}`,
    color: "on",
    is_active: true,
  };
  const fila = await bioFilaPromo(supabase, perfilId);
  if (fila) {
    await supabase.from("bio_links").update(campos).eq("id", fila.id).eq("profile_id", perfilId);
  } else {
    const { count } = await supabase.from("bio_links").select("id", { count: "exact", head: true }).eq("profile_id", perfilId);
    await supabase.from("bio_links").insert({ ...campos, profile_id: perfilId, sort_order: count ?? 0 });
  }
  return true;
}

async function bioApagar(supabase: Supabase, businessId: string): Promise<void> {
  const perfilId = await bioPerfilId(supabase, businessId);
  if (!perfilId) return;
  const fila = await bioFilaPromo(supabase, perfilId);
  if (fila) await supabase.from("bio_links").update({ color: "off" }).eq("id", fila.id).eq("profile_id", perfilId);
}

function esUrl(v: unknown): boolean {
  return typeof v === "string" && /^https?:\/\//i.test(v) && v.length <= 600;
}

function fechaONull(v: unknown): string | null | "invalid" {
  if (v === null || v === undefined || v === "") return null;
  const t = new Date(String(v));
  return Number.isNaN(t.getTime()) ? "invalid" : t.toISOString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const access = await checkBusinessAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const body = await req.json();
    const { action } = body;
    const businessId = auth.businessId;
    const supabase = createServiceClient();

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const perfilId = await bioPerfilId(supabase, businessId);
        return jsonSuccess({ success: true, promotions: data, has_bio_profile: !!perfilId });
      }

      case "save": {
        const p = body.promotion ?? {};
        const name = String(p.name ?? "").trim().slice(0, 80);
        const code = normalizarCodigo(p.code);
        if (!name) return jsonError("Poné un nombre para identificar la promoción", 400);
        if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
          return jsonError("El código debe tener entre 3 y 30 caracteres: letras, números, guion o guion bajo", 400);
        }

        const discount_type = String(p.discount_type);
        if (!["percent", "fixed", "free"].includes(discount_type)) return jsonError("Tipo de descuento inválido", 400);
        let discount_value = discount_type === "free" ? 0 : Number(p.discount_value);
        if (!Number.isFinite(discount_value)) return jsonError("Valor de descuento inválido", 400);
        discount_value = Math.round(discount_value * 100) / 100;
        if (discount_type === "percent" && (discount_value < 1 || discount_value > 100)) {
          return jsonError("El porcentaje tiene que estar entre 1 y 100", 400);
        }
        if (discount_type === "fixed" && discount_value <= 0) {
          return jsonError("El monto de descuento tiene que ser mayor a 0", 400);
        }

        const applies_to = String(p.applies_to);
        if (!["shop", "reservas", "both"].includes(applies_to)) return jsonError("Elegí dónde aplica la promoción", 400);

        const min_amount = Math.max(0, Number(p.min_amount) || 0);
        let max_uses: number | null = null;
        if (p.max_uses !== null && p.max_uses !== undefined && p.max_uses !== "") {
          max_uses = Math.floor(Number(p.max_uses));
          if (!Number.isFinite(max_uses) || max_uses < 1) return jsonError("El límite de usos tiene que ser 1 o más", 400);
        }

        const starts_at = fechaONull(p.starts_at);
        const ends_at = fechaONull(p.ends_at);
        if (starts_at === "invalid" || ends_at === "invalid") return jsonError("Fecha inválida", 400);
        if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at)) {
          return jsonError("La fecha de fin tiene que ser posterior a la de inicio", 400);
        }

        const image_url = p.image_url ? String(p.image_url) : null;
        if (image_url && !esUrl(image_url)) return jsonError("Imagen inválida", 400);
        const show_in_bio = !!p.show_in_bio;
        if (show_in_bio && !image_url) return jsonError("Para mostrarla en la Bio subí una imagen de la promoción", 400);

        const campos = {
          name,
          code,
          description: String(p.description ?? "").trim().slice(0, 300) || null,
          image_url,
          discount_type,
          discount_value,
          applies_to,
          min_amount,
          max_uses,
          starts_at,
          ends_at,
          is_active: p.is_active !== false,
          show_in_bio,
          bio_label: String(p.bio_label ?? "").trim().slice(0, 60) || null,
          updated_at: new Date().toISOString(),
        };

        let saved: Row;
        let estabaEnBio = false;
        if (p.id) {
          const { data: previa } = await supabase
            .from("promotions").select("id, show_in_bio").eq("id", p.id).eq("business_id", businessId).maybeSingle();
          if (!previa) return jsonError("Promoción no encontrada", 404);
          estabaEnBio = !!previa.show_in_bio;
          const { data, error } = await supabase
            .from("promotions").update(campos).eq("id", p.id).eq("business_id", businessId).select().single();
          if (error) {
            if (error.code === "23505") return jsonError("Ya existe una promoción con ese código", 400);
            throw error;
          }
          saved = data;
        } else {
          const { data, error } = await supabase
            .from("promotions").insert({ ...campos, business_id: businessId }).select().single();
          if (error) {
            if (error.code === "23505") return jsonError("Ya existe una promoción con ese código", 400);
            throw error;
          }
          saved = data;
        }

        let bio_sync: "ok" | "no_profile" | "off" | "none" = "none";
        if (show_in_bio && saved.is_active) {
          await supabase.from("promotions").update({ show_in_bio: false }).eq("business_id", businessId).neq("id", saved.id);
          bio_sync = (await bioEncender(supabase, businessId, saved)) ? "ok" : "no_profile";
        } else if (estabaEnBio) {
          await bioApagar(supabase, businessId);
          bio_sync = "off";
        }
        return jsonSuccess({ success: true, promotion: saved, bio_sync });
      }

      case "toggle": {
        const { id, is_active } = body;
        if (!id || typeof is_active !== "boolean") return jsonError("Datos incompletos", 400);
        const { data, error } = await supabase
          .from("promotions")
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq("id", id).eq("business_id", businessId).select().maybeSingle();
        if (error) throw error;
        if (!data) return jsonError("Promoción no encontrada", 404);
        if (data.show_in_bio) {
          if (is_active) await bioEncender(supabase, businessId, data);
          else await bioApagar(supabase, businessId);
        }
        return jsonSuccess({ success: true, promotion: data });
      }

      case "delete": {
        const { id } = body;
        if (!id) return jsonError("Datos incompletos", 400);
        const { data: previa } = await supabase
          .from("promotions").select("id, show_in_bio").eq("id", id).eq("business_id", businessId).maybeSingle();
        if (!previa) return jsonError("Promoción no encontrada", 404);
        const { error } = await supabase.from("promotions").delete().eq("id", id).eq("business_id", businessId);
        if (error) throw error;
        if (previa.show_in_bio) await bioApagar(supabase, businessId);
        return jsonSuccess({ success: true });
      }

      default:
        return jsonError("Acción inválida", 400);
    }
  } catch (err) {
    console.error("admin-manage-promotions error:", err);
    return jsonError(err instanceof Error ? err.message : "Error interno");
  }
});
