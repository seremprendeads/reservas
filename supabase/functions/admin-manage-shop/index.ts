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

// Debe coincidir con PLAN_LIMITS.products en src/modules/shop/config.ts.
// Ese valor de ahi es solo para la UI — el limite real (el que no se puede
// esquivar llamando esta funcion directo) se aplica aca.
const DEFAULT_PRODUCT_LIMIT = 12;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const access = await checkBusinessAccess(auth.businessId, "shop");
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const body = await req.json();
    const { action, id, product, name, is_active } = body;
    const businessId = auth.businessId;
    const supabase = createServiceClient();

    switch (action) {
      case "list": {
        const [productsRes, categoriesRes, ordersRes, businessRes] = await Promise.all([
          supabase.from("shop_products").select("*").eq("business_id", businessId).is("deleted_at", null).order("sort_order"),
          supabase.from("shop_categories").select("*").eq("business_id", businessId).order("sort_order"),
          supabase.from("shop_orders").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
          supabase.from("businesses").select("product_limit").eq("id", businessId).maybeSingle(),
        ]);
        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (ordersRes.error) throw ordersRes.error;

        const { data: trash, error: trashError } = await supabase
          .from("shop_products")
          .select("*")
          .eq("business_id", businessId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });
        if (trashError) throw trashError;

        return jsonSuccess({
          success: true,
          products: productsRes.data,
          categories: categoriesRes.data,
          orders: ordersRes.data,
          trash,
          product_limit: businessRes.data?.product_limit ?? DEFAULT_PRODUCT_LIMIT,
        });
      }

      case "product_save": {
        if (!product?.name || product.price === undefined || product.price === null) {
          return jsonError("Nombre y precio son requeridos", 400);
        }

        const payload = {
          name: String(product.name).trim(),
          description: String(product.description || "").trim(),
          price: parseFloat(product.price),
          currency: product.currency || "ARS",
          stock: Number.isFinite(product.stock) ? product.stock : parseInt(product.stock) || 0,
          sku: product.sku || null,
          image: product.image || null,
          images: Array.isArray(product.images) ? product.images : [],
          category_id: product.category_id || null,
          featured: !!product.featured,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
        };

        if (id) {
          const { error } = await supabase
            .from("shop_products")
            .update(payload)
            .eq("id", id)
            .eq("business_id", businessId);
          if (error) throw error;
        } else {
          // Nuevo producto: se cuenta contra el limite (el limite solo
          // cuenta activos, un producto nuevo arranca activo).
          const limitCheck = await checkProductLimit(supabase, businessId);
          if (!limitCheck.ok) return jsonError(limitCheck.message, 403);

          const { error } = await supabase
            .from("shop_products")
            .insert({ ...payload, business_id: businessId, is_active: true });
          if (error) throw error;
        }
        return jsonSuccess({ success: true });
      }

      case "product_toggle": {
        if (!id) return jsonError("id es requerido", 400);
        if (is_active === undefined) return jsonError("is_active es requerido", 400);

        if (is_active) {
          const limitCheck = await checkProductLimit(supabase, businessId);
          if (!limitCheck.ok) return jsonError(limitCheck.message, 403);
        }

        const { error } = await supabase
          .from("shop_products")
          .update({ is_active })
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "product_trash": {
        if (!id) return jsonError("id es requerido", 400);
        const { error } = await supabase
          .from("shop_products")
          .update({ deleted_at: new Date().toISOString(), is_active: false })
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "product_restore": {
        if (!id) return jsonError("id es requerido", 400);
        const limitCheck = await checkProductLimit(supabase, businessId);
        if (!limitCheck.ok) return jsonError(limitCheck.message, 403);
        const { error } = await supabase
          .from("shop_products")
          .update({ deleted_at: null, is_active: true })
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "product_purge": {
        if (!id) return jsonError("id es requerido", 400);
        const { error } = await supabase
          .from("shop_products")
          .delete()
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "category_create": {
        if (!name?.trim()) return jsonError("Nombre requerido", 400);
        const { error } = await supabase
          .from("shop_categories")
          .insert({ business_id: businessId, name: name.trim() });
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "category_delete": {
        if (!id) return jsonError("id es requerido", 400);
        const { error } = await supabase
          .from("shop_categories")
          .delete()
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      case "order_delete": {
        if (!id) return jsonError("id es requerido", 400);
        const { error } = await supabase
          .from("shop_orders")
          .delete()
          .eq("id", id)
          .eq("business_id", businessId);
        if (error) throw error;
        return jsonSuccess({ success: true });
      }

      default:
        return jsonError("Acción inválida", 400);
    }
  } catch (err) {
    console.error("admin-manage-shop error:", err);
    return jsonError("Error interno");
  }
});

async function checkProductLimit(
  supabase: ReturnType<typeof createServiceClient>,
  businessId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: biz } = await supabase
    .from("businesses")
    .select("product_limit")
    .eq("id", businessId)
    .maybeSingle();
  const limit = biz?.product_limit ?? DEFAULT_PRODUCT_LIMIT;

  const { count, error } = await supabase
    .from("shop_products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw error;

  if ((count ?? 0) >= limit) {
    return { ok: false, message: `Llegaste al límite de ${limit} productos activos de tu plan.` };
  }
  return { ok: true };
}
