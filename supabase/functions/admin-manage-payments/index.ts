import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, action, provider, credentials } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: verified } = await supabase.rpc("verify_admin_password", {
      input_password: password,
      stored_hash: admin.password_hash,
    });

    if (!verified) {
      return new Response(JSON.stringify({ success: false, error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shopId = "00000000-0000-0000-0000-000000000000";

    if (action === "list") {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .eq("shop_id", shopId)
        .order("provider");

      if (error) throw error;

      const masked = (data || []).map((p: Record<string, unknown>) => ({
        ...p,
        access_token: p.access_token ? mask(p.access_token as string) : null,
        client_secret: p.client_secret ? mask(p.client_secret as string) : null,
      }));

      return new Response(JSON.stringify({ success: true, providers: masked }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      const { error } = await supabase
        .from("payment_providers")
        .upsert(
          {
            shop_id: shopId,
            provider,
            access_token: credentials?.access_token || null,
            client_id: credentials?.client_id || null,
            client_secret: credentials?.client_secret || null,
            wallet_address: credentials?.wallet_address || null,
            public_key: credentials?.public_key || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "shop_id,provider" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test") {
      const { data: prov } = await supabase
        .from("payment_providers")
        .select("access_token, client_id, client_secret")
        .eq("shop_id", shopId)
        .eq("provider", provider)
        .maybeSingle();

      if (!prov) {
        return new Response(JSON.stringify({ success: false, error: "Proveedor no configurado" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let testResult = false;
      let testError = "";

      if (provider === "mercadopago") {
        try {
          if (prov.access_token) {
            const res = await fetch("https://api.mercadopago.com/users/me", {
              headers: { Authorization: `Bearer ${prov.access_token}` },
            });
            if (res.ok) {
              testResult = true;
            } else {
              testError = `HTTP ${res.status}`;
            }
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
            if (res.ok) {
              testResult = true;
            } else {
              testError = `HTTP ${res.status}`;
            }
          } else {
            testError = "Ingresá el Access Token o las credenciales OAuth";
          }
        } catch (e) {
          testError = (e as Error).message;
        }
      } else if (provider === "stripe") {
        try {
          const res = await fetch("https://api.stripe.com/v1/balance", {
            headers: {
              Authorization: `Bearer ${prov.access_token}`,
            },
          });
          if (res.ok) {
            testResult = true;
          } else {
            testError = `HTTP ${res.status}`;
          }
        } catch (e) {
          testError = (e as Error).message;
        }
      } else if (provider === "paypal") {
        try {
          const auth = btoa(`${prov.client_id}:${prov.client_secret}`);
          const res = await fetch("https://api-m.sandbox.paypal.com/v1/identity/platform/v1/merchant-info", {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (res.ok) {
            testResult = true;
          } else {
            testError = `HTTP ${res.status}`;
          }
        } catch (e) {
          testError = (e as Error).message;
        }
      }

      if (testResult) {
        await supabase
          .from("payment_providers")
          .update({ status: "connected", last_tested_at: new Date().toISOString() })
          .eq("shop_id", shopId)
          .eq("provider", provider);
      }

      return new Response(JSON.stringify({ success: testResult, error: testError || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("payment_providers")
        .update({ status: "disconnected" })
        .eq("shop_id", shopId)
        .eq("provider", provider);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("payment_providers")
        .delete()
        .eq("shop_id", shopId)
        .eq("provider", provider);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Acción no válida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ success: false, error: "Error interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function mask(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}
