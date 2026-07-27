export type CalendarProviderId = 'google' | 'outlook' | 'apple';

export type IntegrationStatus = 'disconnected' | 'connected' | 'error' | 'syncing';

export interface CalendarIntegration {
  id: string;
  tenant_id: string;
  provider: CalendarProviderId;
  calendar_id: string;
  calendar_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_connected: boolean;
  auto_sync: boolean;
  on_delete_action: 'mark_cancelled' | 'delete_event';
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id?: string;
  external_event_id?: string;
  booking_id: string;
  title: string;
  description: string;
  location?: string;
  start_datetime: string;
  end_datetime: string;
  attendees?: CalendarAttendee[];
  status: 'confirmed' | 'cancelled' | 'tentative';
}

export interface CalendarAttendee {
  email: string;
  name?: string;
}

export interface SyncResult {
  success: boolean;
  action: 'created' | 'updated' | 'deleted' | 'skipped' | 'error';
  external_event_id?: string;
  error_message?: string;
}

export interface SyncLog {
  id: string;
  tenant_id: string;
  integration_id: string;
  booking_id: string;
  booking_code: string;
  action: 'created' | 'updated' | 'deleted' | 'full_sync' | 'error';
  provider: CalendarProviderId;
  result: 'success' | 'error';
  error_message?: string;
  created_at: string;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
}

export interface CalendarProvider {
  readonly id: CalendarProviderId;
  readonly label: string;
  readonly icon: string;

  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string; expires_at: string }>;
  refreshAccessToken(refresh_token: string): Promise<{ access_token: string; expires_at: string }>;
  listCalendars(access_token: string): Promise<CalendarListEntry[]>;
  createEvent(access_token: string, calendar_id: string, event: CalendarEvent): Promise<string>;
  updateEvent(access_token: string, calendar_id: string, event: CalendarEvent): Promise<void>;
  deleteEvent(access_token: string, calendar_id: string, external_event_id: string): Promise<void>;
}
