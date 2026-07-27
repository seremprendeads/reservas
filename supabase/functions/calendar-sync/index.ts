import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_URL = "https://www.googleapis.com/calendar/v3";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const { action, booking_id } = await req.json();
    const supabase = createServiceClient();
    const tenantId = auth.businessId;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

    // Get the integration
    const { data: integration, error: intError } = await supabase
      .from("calendar_integrations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", "google")
      .eq("is_connected", true)
      .maybeSingle();

    if (intError || !integration) {
      return jsonError("No hay conexión con Google Calendar", 400);
    }

    // Refresh token if expired
    let accessToken = integration.access_token;
    if (new Date(integration.expires_at) <= new Date()) {
      const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: integration.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshRes.ok) {
        await logSync(supabase, tenantId, integration.id, null, null, "error", "google", "error", "Token refresh failed");
        return jsonError("Error al renovar token de Google");
      }

      const rd = await refreshRes.json();
      accessToken = rd.access_token;
      const newExpires = new Date(Date.now() + (rd.expires_in || 3600) * 1000).toISOString();
      await supabase
        .from("calendar_integrations")
        .update({ access_token: accessToken, expires_at: newExpires })
        .eq("id", integration.id);
    }

    const calendarId = integration.calendar_id;

    // ── SYNC SINGLE BOOKING ──
    if (action === "sync_booking" && booking_id) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", booking_id)
        .maybeSingle();

      if (!booking) return jsonError("Reserva no encontrada", 404);

      const { data: syncEvent } = await supabase
        .from("calendar_sync_events")
        .select("external_event_id")
        .eq("booking_id", booking_id)
        .eq("integration_id", integration.id)
        .maybeSingle();

      const existingId = syncEvent?.external_event_id || null;

      const date = booking.booking_date;
      const time = (booking.booking_time || "09:00").substring(0, 5);
      const startDt = `${date}T${time}:00-03:00`;
      const [h, m] = time.split(":").map(Number);
      const endMinutes = h * 60 + m + 60;
      const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
      const endM = String(endMinutes % 60).padStart(2, "0");
      const endDt = `${date}T${endH}:${endM}:00-03:00`;

      const statusMap: Record<string, string> = {
        pending: "tentative",
        confirmed: "confirmed",
        completed: "confirmed",
        cancelled: "cancelled",
      };

      const lines: string[] = [];
      lines.push(`Cliente: ${booking.customer_name}`);
      lines.push(`Telefono: ${booking.customer_phone}`);
      if (booking.customer_email) lines.push(`Email: ${booking.customer_email}`);
      lines.push(`Estado: ${booking.booking_status}`);
      if (booking.amount) lines.push(`Monto: $${booking.amount.toLocaleString("es-AR")}`);
      if (booking.booking_code) lines.push(`Codigo: ${booking.booking_code}`);
      if (booking.notas_admin) lines.push(`Notas: ${booking.notas_admin}`);

      const eventPayload = {
        summary: `${booking.customer_name} - ${booking.booking_code}`,
        description: lines.join("\n"),
        start: { dateTime: startDt, timeZone: "America/Argentina/Buenos_Aires" },
        end: { dateTime: endDt, timeZone: "America/Argentina/Buenos_Aires" },
        status: statusMap[booking.booking_status] || "tentative",
      };

      // If cancelled and configured to delete
      if (booking.booking_status === "cancelled" && integration.on_delete_action === "delete_event" && existingId) {
        await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${existingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        await supabase.from("calendar_sync_events").delete().eq("booking_id", booking_id).eq("integration_id", integration.id);
        await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "deleted", "google", "success");
        return jsonSuccess({ action: "deleted", external_event_id: null });
      }

      // If cancelled and configured to mark as cancelled
      if (booking.booking_status === "cancelled" && existingId) {
        await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${existingId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...eventPayload, status: "cancelled" }),
        });
        await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "updated", "google", "success");
        return jsonSuccess({ action: "updated", external_event_id: existingId });
      }

      // Update existing event
      if (existingId) {
        const res = await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${existingId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        });

        if (!res.ok) {
          const errText = await res.text();
          await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "error", "google", "error", errText);
          return jsonError("Error al actualizar evento en Google");
        }

        await supabase.from("calendar_sync_events").update({ synced_at: new Date().toISOString() }).eq("booking_id", booking_id).eq("integration_id", integration.id);
        await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "updated", "google", "success");
        return jsonSuccess({ action: "updated", external_event_id: existingId });
      }

      // Create new event
      const res = await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "error", "google", "error", errText);
        return jsonError("Error al crear evento en Google");
      }

      const newEvent = await res.json();
      await supabase.from("calendar_sync_events").insert({
        tenant_id: tenantId,
        integration_id: integration.id,
        booking_id: booking_id,
        external_event_id: newEvent.id,
      });
      await logSync(supabase, tenantId, integration.id, booking_id, booking.booking_code, "created", "google", "success");
      return jsonSuccess({ action: "created", external_event_id: newEvent.id });
    }

    // ── FULL SYNC ──
    if (action === "full_sync") {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .eq("business_id", tenantId)
        .neq("booking_status", "cancelled")
        .gte("booking_date", new Date().toISOString().split("T")[0]);

      const { data: syncEvents } = await supabase
        .from("calendar_sync_events")
        .select("booking_id, external_event_id")
        .eq("integration_id", integration.id);

      const syncMap = new Map((syncEvents || []).map(e => [e.booking_id, e.external_event_id]));
      let created = 0, updated = 0, skipped = 0, errors = 0;

      for (const booking of bookings || []) {
        if (!booking.booking_date || !booking.booking_time || !booking.customer_name) {
          skipped++;
          continue;
        }

        try {
          const existingId = syncMap.get(booking.id) || null;

          const date = booking.booking_date;
          const time = (booking.booking_time || "09:00").substring(0, 5);
          const startDt = `${date}T${time}:00-03:00`;
          const [h, m] = time.split(":").map(Number);
          const endMinutes = h * 60 + m + 60;
          const endH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
          const endM = String(endMinutes % 60).padStart(2, "0");
          const endDt = `${date}T${endH}:${endM}:00-03:00`;

          const eventPayload = {
            summary: `${booking.customer_name} - ${booking.booking_code}`,
            description: `Cliente: ${booking.customer_name}\nTelefono: ${booking.customer_phone}\nCodigo: ${booking.booking_code}`,
            start: { dateTime: startDt, timeZone: "America/Argentina/Buenos_Aires" },
            end: { dateTime: endDt, timeZone: "America/Argentina/Buenos_Aires" },
            status: "confirmed" as const,
          };

          if (existingId) {
            const res = await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${existingId}`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify(eventPayload),
            });
            if (res.ok) { updated++; } else { errors++; }
          } else {
            const res = await fetch(`${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify(eventPayload),
            });
            if (res.ok) {
              const newEvent = await res.json();
              await supabase.from("calendar_sync_events").insert({
                tenant_id: tenantId,
                integration_id: integration.id,
                booking_id: booking.id,
                external_event_id: newEvent.id,
              });
              created++;
            } else {
              errors++;
            }
          }
        } catch {
          errors++;
        }
      }

      await logSync(supabase, tenantId, integration.id, null, null, "full_sync", "google", errors > 0 ? "error" : "success", errors > 0 ? `${errors} eventos fallaron` : undefined);
      return jsonSuccess({ created, updated, skipped, errors, total: (bookings || []).length });
    }

    return jsonError("Acción no válida", 400);
  } catch (err) {
    console.error("calendar-sync error:", err);
    return jsonError(err instanceof Error ? err.message : "Error interno del servidor");
  }
});

async function logSync(
  supabase: ReturnType<typeof createServiceClient>,
  tenantId: string,
  integrationId: string,
  bookingId: string | null,
  bookingCode: string | null,
  action: string,
  provider: string,
  result: string,
  errorMessage?: string
) {
  await supabase.from("calendar_sync_logs").insert({
    tenant_id: tenantId,
    integration_id: integrationId,
    booking_id: bookingId,
    booking_code: bookingCode,
    action,
    provider,
    result,
    error_message: errorMessage || null,
  });
}
