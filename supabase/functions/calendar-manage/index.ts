import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { authenticateToken, createServiceClient, jsonSuccess, jsonError, jsonUnauthorized, corsHeaders } from "../_shared/auth.ts";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_URL = "https://www.googleapis.com/calendar/v3";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const auth = await authenticateToken(req);
    if ("error" in auth) return jsonUnauthorized();

    const { action, payload } = await req.json();
    const supabase = createServiceClient();
    const tenantId = auth.businessId;

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
    const SITE_URL = Deno.env.get("SITE_URL") || "https://reservas-two-sigma.vercel.app";
    const REDIRECT_URI = `${SITE_URL}/admin`;

    // ── LIST integrations ──
    if (action === "list") {
      const { data, error } = await supabase
        .from("calendar_integrations")
        .select("id, provider, calendar_id, calendar_name, is_connected, auto_sync, on_delete_action, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("provider");

      if (error) throw error;

      return jsonSuccess({ integrations: data || [] });
    }

    // ── GET AUTH URL ──
    if (action === "get_auth_url") {
      const state = btoa(JSON.stringify({ tenant_id: tenantId, ts: Date.now() }));
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        access_type: "offline",
        prompt: "consent",
        state,
      });
      const url = `${GOOGLE_AUTH_URL}?${params.toString()}`;
      return jsonSuccess({ url, state });
    }

    // ── EXCHANGE CODE (complete OAuth) ──
    if (action === "exchange_code") {
      const { code } = payload || {};
      if (!code) return jsonError("Código requerido", 400);

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token exchange failed:", errText);
        return jsonError("Error al intercambiar código con Google");
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Get user info / calendar list
      const calRes = await fetch(`${GOOGLE_CALENDAR_URL}/users/me/calendarList?maxResults=50`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      let calendars: { id: string; summary: string; primary: boolean }[] = [];
      let primaryCalendarId = "primary";

      if (calRes.ok) {
        const calData = await calRes.json();
        calendars = (calData.items || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          summary: c.summary as string,
          primary: c.primary as boolean,
        }));
        const primary = calendars.find(c => c.primary);
        if (primary) primaryCalendarId = primary.id;
      }

      // Upsert integration
      const { error: upsertError } = await supabase
        .from("calendar_integrations")
        .upsert({
          tenant_id: tenantId,
          provider: "google",
          calendar_id: primaryCalendarId,
          calendar_name: calendars.find(c => c.primary)?.summary || "Google Calendar",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: expiresAt,
          is_connected: true,
          auto_sync: true,
          on_delete_action: "mark_cancelled",
        }, { onConflict: "tenant_id,provider" });

      if (upsertError) throw upsertError;

      return jsonSuccess({
        connected: true,
        calendars,
        primary_calendar_id: primaryCalendarId,
      });
    }

    // ── LIST CALENDARS ──
    if (action === "list_calendars") {
      const { data: integration } = await supabase
        .from("calendar_integrations")
        .select("access_token, refresh_token, expires_at")
        .eq("tenant_id", tenantId)
        .eq("provider", "google")
        .eq("is_connected", true)
        .maybeSingle();

      if (!integration) return jsonError("No hay conexión con Google Calendar", 400);

      let accessToken = integration.access_token;

      // Refresh if expired
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

        if (refreshRes.ok) {
          const rd = await refreshRes.json();
          accessToken = rd.access_token;
          const newExpires = new Date(Date.now() + (rd.expires_in || 3600) * 1000).toISOString();
          await supabase
            .from("calendar_integrations")
            .update({ access_token: accessToken, expires_at: newExpires })
            .eq("tenant_id", tenantId)
            .eq("provider", "google");
        }
      }

      const calRes = await fetch(`${GOOGLE_CALENDAR_URL}/users/me/calendarList?maxResults=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!calRes.ok) return jsonError("Error al listar calendarios de Google");

      const calData = await calRes.json();
      const calendars = (calData.items || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        summary: c.summary as string,
        primary: c.primary as boolean,
      }));

      return jsonSuccess({ calendars });
    }

    // ── UPDATE SETTINGS ──
    if (action === "update_settings") {
      const { calendar_id, auto_sync, on_delete_action } = payload || {};
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (calendar_id !== undefined) updates.calendar_id = calendar_id;
      if (auto_sync !== undefined) updates.auto_sync = auto_sync;
      if (on_delete_action !== undefined) updates.on_delete_action = on_delete_action;

      const { error } = await supabase
        .from("calendar_integrations")
        .update(updates)
        .eq("tenant_id", tenantId)
        .eq("provider", "google");

      if (error) throw error;
      return jsonSuccess({ updated: true });
    }

    // ── DISCONNECT ──
    if (action === "disconnect") {
      const { error } = await supabase
        .from("calendar_integrations")
        .update({ is_connected: false, access_token: "", refresh_token: "" })
        .eq("tenant_id", tenantId)
        .eq("provider", "google");

      if (error) throw error;
      return jsonSuccess({ disconnected: true });
    }

    // ── LIST LOGS ──
    if (action === "list_logs") {
      const { limit = 50 } = payload || {};
      const { data, error } = await supabase
        .from("calendar_sync_logs")
        .select("id, booking_id, booking_code, action, provider, result, error_message, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return jsonSuccess({ logs: data || [] });
    }

    return jsonError("Acción no válida", 400);
  } catch (err) {
    console.error("calendar-manage error:", err);
    return jsonError(err instanceof Error ? err.message : "Error interno del servidor");
  }
});
