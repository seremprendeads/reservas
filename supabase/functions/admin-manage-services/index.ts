import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBusinessAccess, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBusinessAccess(auth.businessId);
    if (!access.allowed) {
      return jsonAccessDenied(access.message);
    }

    const { action, service_id, name, description, price, currency, image_url, is_active } = await req.json();

    const supabase = createServiceClient();

    if (action === "create") {
      if (!name || price === undefined || price === null) {
        return jsonError("Nombre y precio son requeridos", 400);
      }
      const { error } = await supabase
        .from("services")
        .insert({
          business_id: auth.businessId,
          name: name.trim(),
          description: (description || "").trim(),
          price: parseFloat(price),
          currency: currency || "ARS",
          image_url: image_url || null,
        });
      if (error) throw error;
    } else if (action === "update") {
      if (!service_id) {
        return jsonError("service_id es requerido", 400);
      }
      const { error } = await supabase
        .from("services")
        .update({
          name: name?.trim(),
          description: (description || "").trim(),
          price: price !== undefined ? parseFloat(price) : undefined,
          currency,
          image_url: image_url !== undefined ? image_url : undefined,
        })
        .eq("id", service_id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else if (action === "toggle_active") {
      if (!service_id) {
        return jsonError("service_id es requerido", 400);
      }
      if (is_active === undefined) {
        return jsonError("is_active es requerido", 400);
      }
      const { error } = await supabase
        .from("services")
        .update({ is_active })
        .eq("id", service_id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else if (action === "delete") {
      if (!service_id) {
        return jsonError("service_id es requerido", 400);
      }
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service_id)
        .eq("business_id", auth.businessId);
      if (error) throw error;
    } else {
      return jsonError("Acción no válida", 400);
    }

    return jsonSuccess();
  } catch (err) {
    console.error("admin-manage-services error:", err);
    return jsonError("Error interno");
  }
});
