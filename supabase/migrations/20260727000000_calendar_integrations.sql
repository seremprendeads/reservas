-- Calendar Integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL DEFAULT '',
  refresh_token TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_connected BOOLEAN NOT NULL DEFAULT false,
  auto_sync BOOLEAN NOT NULL DEFAULT true,
  on_delete_action TEXT NOT NULL DEFAULT 'mark_cancelled' CHECK (on_delete_action IN ('mark_cancelled', 'delete_event')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_integrations_tenant_provider
  ON calendar_integrations(tenant_id, provider);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_integrations_tenant_isolation" ON calendar_integrations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Calendar Sync Events table (maps bookings to external events)
CREATE TABLE IF NOT EXISTS calendar_sync_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_sync_events_booking_integration
  ON calendar_sync_events(booking_id, integration_id);

ALTER TABLE calendar_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_sync_events_tenant_isolation" ON calendar_sync_events
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Calendar Sync Logs table
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  booking_code TEXT,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'full_sync', 'error')),
  provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_logs_tenant
  ON calendar_sync_logs(tenant_id, created_at DESC);

ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_sync_logs_tenant_isolation" ON calendar_sync_logs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
