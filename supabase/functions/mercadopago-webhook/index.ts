import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/auth.ts";
import { descifrar } from "../_shared/crypto.ts";

// ============================================================================
// Webhook de Mercado Pago.
//
// QUE ESTABA MAL ANTES:
//
// 1. La firma se calculaba sobre el cuerpo entero del mensaje. Mercado Pago NO
//    firma el cuerpo: firma un "manifest" armado con tres datos sueltos
//    (id del recurso, x-request-id y timestamp). Con el calculo viejo, TODA
//    notificacion se rechazaba con 401 y ninguna sena confirmaba el turno.
//
// 2. Usaba una unica clave global (MP_WEBHOOK_SECRET). Cada cliente conecta SU
//    propia cuenta de Mercado Pago, y MP genera una clave distinta por
//    integracion. Una sola clave global no puede validar 50 firmas distintas.
//    Ahora la clave sale de payment_providers.webhook_secret, por negocio.
//
// 3. Para saber de que negocio era el pago, probaba el token de CADA cliente
//    conectado contra la API de MP: una llamada por negocio, en cada aviso.
//    Ahora el negocio viaja en la URL de notificacion (?negocio=<id>), que
//    arma create-payment. Una sola consulta, y ademas permite elegir con que
//    clave validar ANTES de confiar en nada del mensaje.
// ============================================================================

/**
 * Valida la firma de Mercado Pago.
 *
 * Cabecera x-signature:  ts=<timestamp>,v1=<hash>
 * Manifest firmado:      id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * Algoritmo:             HMAC-SHA256 con la clave secreta, resultado en hex.
 */
async function validarFirmaMp(
  dataId: string,
  requestId: string | null,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const partes: Record<string, string> = {};
  for (const parte of signatureHeader.split(",")) {
    const i = parte.indexOf("=");
    if (i === -1) continue;
    partes[parte.slice(0, i).trim()] = parte.slice(i + 1).trim();
  }

  const ts = partes["ts"];
  const v1 = partes["v1"];
  if (!ts || !v1) return false;

  // Ventana de 5 minutos contra reenvio de mensajes viejos.
  if (Math.abs(Date.now() - parseInt(ts) * 1000) > 5 * 60 * 1000) {
    // MP manda el ts en segundos; algunas integraciones lo mandan en ms.
    if (Math.abs(Date.now() - parseInt(ts)) > 5 * 60 * 1000) return false;
  }

  // MP indica pasar el id en minusculas si es alfanumerico.
  const idNormalizado = dataId.toLowerCase();
  const manifest = `id:${idNormalizado};request-id:${requestId ?? ""};ts:${ts};`;

  const encoder = new TextEncoder();
  const clave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firma = await crypto.subtle.sign("HMAC", clave, encoder.encode(manifest));
  const esperado = Array.from(new Uint8Array(firma))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparacion de tiempo constante: no cortar en la primera diferencia.
  if (esperado.length !== v1.length) return false;
  let dif = 0;
  for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ v1.charCodeAt(i);
  return dif === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};

    // MP manda varios tipos de aviso; solo interesan los de pago.
    const tipo = body.type || url.searchParams.get("type");
    if (tipo !== "payment") {
      return new Response("OK", { status: 200 });
    }

    // El id puede venir en la query (data.id) o en el cuerpo.
    const paymentId = url.searchParams.get("data.id") || body.data?.id;
    if (!paymentId) {
      return new Response("No payment ID", { status: 200 });
    }

    // De que negocio es este aviso. Lo pone create-payment en notification_url.
    const negocioId = url.searchParams.get("negocio");
    if (!negocioId) {
      console.error("Webhook sin parametro negocio — preferencia creada antes del arreglo");
      return new Response("Missing business", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: prov } = await supabase
      .from("payment_providers")
      .select("business_id, access_token, webhook_secret")
      .eq("business_id", negocioId)
      .eq("provider", "mercadopago")
      .eq("status", "connected")
      .maybeSingle();

    if (!prov) {
      console.error("Negocio sin Mercado Pago conectado:", negocioId);
      return new Response("No MP provider", { status: 200 });
    }

    // Clave del negocio; si no cargo la suya, se prueba la global como respaldo.
    const webhookSecret = (await descifrar(prov.webhook_secret))
      || Deno.env.get("MP_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("Sin clave de webhook para el negocio:", negocioId);
      return new Response("Webhook secret not configured", { status: 200 });
    }

    const firmaValida = await validarFirmaMp(
      String(paymentId),
      req.headers.get("x-request-id"),
      req.headers.get("x-signature"),
      webhookSecret
    );
    if (!firmaValida) {
      console.error("Firma invalida para el negocio:", negocioId);
      return new Response("Invalid signature", { status: 401 });
    }

    // Recien despues de validar la firma se consulta el pago real.
    const accessToken = await descifrar(prov.access_token);
    if (!accessToken) {
      console.error("Negocio sin access token:", negocioId);
      return new Response("No access token", { status: 200 });
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("No se pudo leer el pago en MP:", res.status);
      return new Response("Payment fetch failed", { status: 200 });
    }
    const payment = await res.json();

    if (payment.status !== "approved") {
      return new Response("Payment not approved", { status: 200 });
    }

    const extRef = payment.external_reference as string;
    if (!extRef) {
      return new Response("No external reference", { status: 200 });
    }

    const { data: existingBooking, error: findError } = await supabase
      .from("bookings")
      .select("id, business_id, booking_date, booking_time, customer_name, booking_code, payment_status")
      .eq("booking_code", extRef)
      .eq("business_id", prov.business_id)
      .maybeSingle();

    if (findError) throw findError;

    if (!existingBooking) {
      console.error("Reserva no encontrada para el codigo:", extRef);
      return new Response("Booking not found", { status: 200 });
    }

    const businessId = existingBooking.business_id;

    // Idempotencia: MP reintenta los avisos, no procesar dos veces.
    if (existingBooking.payment_status === "approved") {
      return new Response("Already processed", { status: 200 });
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        payment_status: "approved",
        payment_id: String(paymentId),
        booking_status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("booking_code", extRef)
      .eq("business_id", businessId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // Aviso al duenio del negocio via ntfy
    if (booking) {
      const ntfyEnabled = Deno.env.get("NTFY_ENABLED");
      const ntfyTopic = Deno.env.get(`NTFY_TOPIC_${businessId.replace(/-/g, "_")}`)
        || Deno.env.get("NTFY_TOPIC");

      if (ntfyTopic && ntfyEnabled === "true") {
        const fecha = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("es-AR", {
          weekday: "long", day: "numeric", month: "long"
        });
        const hora = booking.booking_time.slice(0, 5);

        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: "POST",
          headers: {
            "Title": "Nueva reserva confirmada",
            "Priority": "high",
            "Tags": "white_check_mark,calendar",
            "Content-Type": "text/plain",
          },
          body: `Cliente: ${booking.customer_name}\nFecha: ${fecha}\nHora: ${hora} hs\nCodigo: ${extRef}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
