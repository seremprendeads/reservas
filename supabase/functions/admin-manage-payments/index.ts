import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

function mask(s: string): string {
  if (s.length <= 8) return "****";
  return s.slice(0, 4) + "****" + s.slice(-4);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ('error' in auth) {
      return jsonUnauthorized();
    }

    const { action, provider, credentials } = await req.json();

    const supabase = createServiceClient();

    if (action === "list") {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .eq("business_id", auth.businessId)
        .order("provider");

      if (error) throw error;

      const masked = (data || []).map((p: Record<string, unknown>) => ({
        ...p,
        access_token: p.access_token ? mask(p.access_token as string) : null,
        client_secret: p.client_secret ? mask(p.client_secret as string) : null,
      }));

      return jsonSuccess({ success: true, providers: masked });
    }

    if (action === "save") {
      const { error } = await supabase
        .from("payment_providers")
        .upsert(
          {
            business_id: auth.businessId,
            provider,
            access_token: credentials?.access_token || null,
            client_id: credentials?.client_id || null,
            client_secret: credentials?.client_secret || null,
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

      let testResult = false;
      let testError = "";

      if (provider === "mercadopago") {
        try {
          if (prov.access_token) {
            const res = await fetch("https://api.mercadopago.com/users/me", {
              headers: { Authorization: `Bearer ${prov.access_token}` },
            });
            testResult = res.ok;
            if (!res.ok) testError = `HTTP ${res.status}`;
          } else if (prov.client_id && prov.client_secret) {
            const res = await fetch("https://api.mercadopago.com/oauth/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: prov.client_id,
                client_secret: prov.client_secret,
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
            headers: { Authorization: `Bearer ${prov.access_token}` },
          });
          testResult = res.ok;
          if (!res.ok) testError = `HTTP ${res.status}`;
        } catch (e) {
          testError = (e as Error).message;
        }
      } else if (provider === "paypal") {
        try {
          const authStr = btoa(`${prov.client_id}:${prov.client_secret}`);
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
