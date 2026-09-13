import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, jsonAccessDenied, checkBusinessAccess, corsHeaders } from "../_shared/auth.ts";
import { cifrar, descifrar } from "../_shared/crypto.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const access = await checkBusinessAccess(auth.businessId, "reservas");
    if (!access.allowed) {
      return jsonAccessDenied(access.message, "reason" in access ? access.reason : undefined);
    }

    const { action, provider, credentials } = await req.json();

    const supabase = createServiceClient();

    if (action === "list") {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("id, business_id, provider, status, client_id, public_key, wallet_address, last_tested_at, created_at, updated_at")
        .eq("business_id", auth.businessId)
        .order("provider");

      if (error) throw error;

      return jsonSuccess({ success: true, providers: data || [] });
    }

    if (action === "save") {
      // El formulario nunca recibe de vuelta los secretos guardados (no se
      // devuelven al navegador), así que llega vacío en cada visita. Si se
      // guardara tal cual, cada "Guardar" borraría las credenciales.
      // Por eso: campo vacío = "no lo toques"; campo con valor = reemplazar.
      const { data: actual } = await supabase
        .from("payment_providers")
        .select("access_token, client_secret, webhook_secret")
        .eq("business_id", auth.businessId)
        .eq("provider", provider)
        .maybeSingle();

      const conservarSiVacio = async (nuevo: string | undefined, guardado: string | null | undefined) => {
        if (nuevo && nuevo.trim()) return await cifrar(nuevo.trim());
        return guardado ?? null;
      };

      const { error } = await supabase
        .from("payment_providers")
        .upsert(
          {
            business_id: auth.businessId,
            provider,
            access_token: await conservarSiVacio(credentials?.access_token, actual?.access_token),
            client_id: credentials?.client_id || null,
            client_secret: await conservarSiVacio(credentials?.client_secret, actual?.client_secret),
            webhook_secret: await conservarSiVacio(credentials?.webhook_secret, actual?.webhook_secret),
            wallet_address: credentials?.wallet_address || null,
            public_key: credentials?.public_key || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "business_id,provider" }
        );

      if (error) throw error;
      return jsonSuccess();
    }

    if (action === "test") {
      const { data: prov } = await supabase
        .from("payment_providers")
        .select("access_token, client_id, client_secret")
        .eq("business_id", auth.businessId)
        .eq("provider", provider)
        .maybeSingle();

      if (!prov) {
        return jsonError("Proveedor no configurado", 404);
      }

      // Los secretos están cifrados en la base: se descifran solo acá, en memoria,
      // para probar la conexión. Nunca se devuelven al navegador.
      const accessToken = await descifrar(prov.access_token);
      const clientSecret = await descifrar(prov.client_secret);

      let testResult = false;
      let testError = "";

      if (provider === "mercadopago") {
        try {
          if (accessToken) {
            const res = await fetch("https://api.mercadopago.com/users/me", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            testResult = res.ok;
            if (!res.ok) testError = `HTTP ${res.status}`;
          } else if (prov.client_id && clientSecret) {
            const res = await fetch("https://api.mercadopago.com/oauth/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: prov.client_id,
                client_secret: clientSecret,
                grant_type: "client_credentials",
              }),
            });
            testResult = res.ok;
            if (!res.ok) testError = `HTTP ${res.status}`;
          } else {
            testError = "Ingresá el Access Token o las credenciales OAuth";
          }
        } catch (e) {
          testError = (e as Error).message;
        }
      } else if (provider === "stripe") {
        try {
          const res = await fetch("https://api.stripe.com/v1/balance", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          testResult = res.ok;
          if (!res.ok) testError = `HTTP ${res.status}`;
        } catch (e) {
          testError = (e as Error).message;
        }
      } else if (provider === "paypal") {
        try {
          const authStr = btoa(`${prov.client_id}:${clientSecret}`);
          const res = await fetch("https://api-m.sandbox.paypal.com/v1/identity/platform/v1/merchant-info", {
            headers: { Authorization: `Basic ${authStr}` },
          });
          testResult = res.ok;
          if (!res.ok) testError = `HTTP ${res.status}`;
        } catch (e) {
          testError = (e as Error).message;
        }
      }

      if (testResult) {
        await supabase
          .from("payment_providers")
          .update({ status: "connected", last_tested_at: new Date().toISOString() })
          .eq("business_id", auth.businessId)
          .eq("provider", provider);
      } else {
        // Sin esto, un fallo de conexión no deja rastro en los logs y hay que
        // adivinar por qué el proveedor quedó en "disconnected".
        console.error(`Prueba de conexión fallida — proveedor: ${provider}, motivo: ${testError || "sin detalle"}`);
      }

      return jsonSuccess({ success: testResult, error: testError || null });
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("payment_providers")
        .update({ status: "disconnected" })
        .eq("business_id", auth.businessId)
        .eq("provider", provider);

      if (error) throw error;
      return jsonSuccess();
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("payment_providers")
        .delete()
        .eq("business_id", auth.businessId)
        .eq("provider", provider);

      if (error) throw error;
      return jsonSuccess();
    }

    return jsonError("Acción no válida", 400);
  } catch (err) {
    console.error("admin-manage-payments error:", err);
    return jsonError("Error interno");
  }
});
