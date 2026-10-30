import type { createServiceClient } from "./auth.ts";

// ============================================================================
// Logica compartida de promociones. La usan validate-promo (vista previa),
// create-payment (reservas) y create-shop-payment (tienda): el descuento SIEMPRE
// se calcula aca, en el servidor, sobre el precio real de la base de datos.
// ============================================================================

type Supabase = ReturnType<typeof createServiceClient>;

export type PromoScope = "shop" | "reservas";

export interface PromoRow {
  id: string;
  business_id: string;
  name: string;
  code: string;
  discount_type: "percent" | "fixed" | "free";
  discount_value: number;
  applies_to: "shop" | "reservas" | "both";
  min_amount: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export const redondear = (n: number) => Math.round(n * 100) / 100;

export function normalizarCodigo(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);
}

export function calcularDescuento(promo: Pick<PromoRow, "discount_type" | "discount_value">, base: number): number {
  let d = 0;
  if (promo.discount_type === "free") d = base;
  else if (promo.discount_type === "percent") d = (base * Number(promo.discount_value)) / 100;
  else d = Number(promo.discount_value);
  return redondear(Math.min(Math.max(d, 0), base));
}

export type ResultadoPromo =
  | { ok: true; promo: PromoRow; descuento: number; final: number }
  | { ok: false; error: string };

const MSG_INVALIDO = "Código inválido o vencido";

export async function buscarPromo(
  supabase: Supabase,
  businessId: string,
  codigo: string,
  scope: PromoScope,
  base: number,
): Promise<ResultadoPromo> {
  if (!codigo) return { ok: false, error: MSG_INVALIDO };

  const { data } = await supabase
    .from("promotions")
    .select("id, business_id, name, code, discount_type, discount_value, applies_to, min_amount, max_uses, uses_count, starts_at, ends_at, is_active")
    .eq("business_id", businessId)
    .eq("code", codigo)
    .maybeSingle();

  const promo = data as PromoRow | null;
  const ahora = Date.now();

  // Mismo mensaje para "no existe", "apagado", "otro canal" o "fuera de fecha":
  // asi nadie puede adivinar que codigos existen probando.
  if (
    !promo || !promo.is_active ||
    (promo.applies_to !== "both" && promo.applies_to !== scope) ||
    (promo.starts_at && new Date(promo.starts_at).getTime() > ahora) ||
    (promo.ends_at && new Date(promo.ends_at).getTime() < ahora)
  ) {
    return { ok: false, error: MSG_INVALIDO };
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return { ok: false, error: "Este código ya alcanzó su límite de usos" };
  }
  if (Number(promo.min_amount) > 0 && base < Number(promo.min_amount)) {
    return { ok: false, error: `Este código aplica a compras desde $${Number(promo.min_amount).toLocaleString("es-AR")}` };
  }

  const descuento = calcularDescuento(promo, base);
  return { ok: true, promo, descuento, final: redondear(base - descuento) };
}

// Precio real de una reserva: el del servicio elegido o, si no hay, el general
// de settings. Misma regla que create-payment (nunca el amount del navegador).
export async function precioReserva(
  supabase: Supabase,
  businessId: string,
  serviceId?: string | null,
): Promise<{ precio: number | null; nombre: string }> {
  let nombre = "Turno reservado";
  let precio: number | null = null;
  if (serviceId) {
    const { data: service } = await supabase
      .from("services")
      .select("name, price")
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (service) {
      nombre = service.name;
      precio = service.price;
    }
  }
  if (precio === null) {
    const { data: settings } = await supabase
      .from("settings")
      .select("price")
      .eq("business_id", businessId)
      .maybeSingle();
    precio = settings?.price ?? null;
  }
  return { precio, nombre };
}
