import type { CalendarProvider, CalendarEvent, CalendarListEntry } from '../types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

export function buildGoogleAuthUrl(redirectUri: string, clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_at: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const data = await res.json();
  const expires_at = new Date(Date.now() + data.expires_in * 1000).toISOString();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at,
  };
}

export async function refreshGoogleToken(
  refresh_token: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_at: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = await res.json();
  const expires_at = new Date(Date.now() + data.expires_in * 1000).toISOString();

  return {
    access_token: data.access_token,
    expires_at,
  };
}

export async function listGoogleCalendars(accessToken: string): Promise<CalendarListEntry[]> {
  const res = await fetch(`${GOOGLE_CALENDAR_URL}/users/me/calendarList?maxResults=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Failed to list calendars: ${res.statusText}`);

  const data = await res.json();
  return (data.items || []).map((cal: Record<string, unknown>) => ({
    id: cal.id as string,
    summary: cal.summary as string,
    description: cal.description as string | undefined,
    primary: cal.primary as boolean,
  }));
}

export function buildGoogleEventPayload(event: CalendarEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.start_datetime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: event.end_datetime,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
  };

  if (event.location) payload.location = event.location;
  if (event.attendees?.length) {
    payload.attendees = event.attendees.map(a => ({
      email: a.email,
      displayName: a.name,
    }));
  }

  return payload;
}

export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<string> {
  const payload = buildGoogleEventPayload(event);
  const res = await fetch(
    `${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create event: ${err}`);
  }

  const data = await res.json();
  return data.id;
}

export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<void> {
  if (!event.external_event_id) throw new Error('external_event_id required for update');

  const payload = buildGoogleEventPayload(event);
  const res = await fetch(
    `${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${event.external_event_id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update event: ${err}`);
  }
}

export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  externalEventId: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_CALENDAR_URL}/calendars/${encodeURIComponent(calendarId)}/events/${externalEventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete event: ${err}`);
  }
}
