import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBioAccess, corsHeaders } from "../_shared/auth.ts";

// ============================================================================
// admin-legal-info
//
// Lee y guarda los datos legales del negocio del admin autenticado.
//   body { action: "get" }
//   body { action: "update", legal_name, tax_id, address, city, province, country, contact_email, phone }
//
// Multi-tenant: el business_id sale SOLO del JWT (authenticateToken).
// Cualquier business_id que llegue en el body se ignora.
//
// Acceso: checkBioAccess (solo bloquea cuentas suspendidas). Los datos legales
// deben poder completarse en cualquier plan activo, igual que el perfil.
//
// Errores de validación: HTTP 200 con success:false, para que
// supabase.functions.invoke los entregue en `data` y el panel muestre el mensaje.
// ============================================================================

const FIELD_LIMITS = {
  legal_name: 150,
  tax_id: 30,
  address: 200,
  city: 100,
  province: 100,
  country: 60,
  contact_email: 254,
  phone: 40,
} as const;

type LegalField = keyof typeof FIELD_LIMITS;

const FIELD_LABELS: Record<LegalField, string> = {
  legal_name: "Titular o razón social",
  tax_id: "CUIT",
  address: "Domicilio",
  city: "Ciudad o localidad",
  province: "Provincia",
  country: "País",
  contact_email: "Email de contacto",
  phone: "Teléfono",
};

const SELECT_FIELDS = "legal_name, tax_id, address, city, province, country, contact_email, phone, updated_at";

function fail(error: string) {
  return jsonSuccess({ success: false, error });
}

function isArgentina(country: string | null): boolean {
  if (!country) return false;
  const c = country.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return c === "argentina" || c === "ar" || c === "republica argentina";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const access = await checkBioAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action === "update" ? "update" : "get";
    const supabase = createServiceClient();

    if (action === "get") {
      const { data, error } = await supabase
        .from("business_legal_info")
        .select(SELECT_FIELDS)
        .eq("business_id", auth.businessId)
        .maybeSingle();
      if (error) throw error;
      return jsonSuccess({ success: true, legal_info: data || null });
    }

    // action === "update"
    const values: Record<LegalField, string | null> = {} as Record<LegalField, string | null>;
    for (const key of Object.keys(FIELD_LIMITS) as LegalField[]) {
      const raw = body?.[key];
      if (raw !== undefined && raw !== null && typeof raw !== "string") {
        return fail(`${FIELD_LABELS[key]}: valor inválido`);
      }
      const value = (raw || "").trim().replace(/\s+/g, " ");
      if (value.length > FIELD_LIMITS[key]) {
        return fail(`${FIELD_LABELS[key]}: máximo ${FIELD_LIMITS[key]} caracteres`);
      }
      values[key] = value || null;
    }

    if (values.contact_email) {
      values.contact_email = values.contact_email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email)) {
        return fail("Ingresá un email de contacto válido");
      }
    }

    if (values.tax_id && isArgentina(values.country) && !/^\d{11}$/.test(values.tax_id.replace(/[\s-]/g, ""))) {
      return fail("El CUIT debe tener 11 números");
    }

    const { data, error } = await supabase
      .from("business_legal_info")
      .upsert(
        {
          business_id: auth.businessId,
          ...values,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      )
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    return jsonSuccess({ success: true, legal_info: data });
  } catch (err) {
    console.error("admin-legal-info error:", err);
    return jsonError("Error interno");
  }
});
