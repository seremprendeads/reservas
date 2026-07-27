import { useState, useEffect, useCallback } from 'react';
import { authInvoke } from '../../pages/admin/helpers';

interface CalendarIntegrationData {
  id: string;
  provider: string;
  calendar_id: string;
  calendar_name: string;
  is_connected: boolean;
  auto_sync: boolean;
  on_delete_action: string;
  created_at: string;
  updated_at: string;
}

interface CalendarListEntry {
  id: string;
  summary: string;
  primary: boolean;
}

export function useCalendarIntegrations() {
  const [integrations, setIntegrations] = useState<CalendarIntegrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<CalendarListEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await authInvoke('calendar-manage', { action: 'list' });
      if (data?.success) setIntegrations(data.integrations || []);
    } catch (e) {
      console.error('Failed to load integrations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const googleIntegration = integrations.find(i => i.provider === 'google');

  const connectGoogle = useCallback(async () => {
    setConnecting(true);
    try {
      const { data } = await authInvoke('calendar-manage', { action: 'get_auth_url' });
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Failed to get auth URL:', e);
      setConnecting(false);
    }
  }, []);

  const completeOAuth = useCallback(async (code: string) => {
    setConnecting(true);
    try {
      const { data } = await authInvoke('calendar-manage', {
        action: 'exchange_code',
        payload: { code },
      });
      if (data?.success) {
        if (data.calendars) setCalendars(data.calendars);
        await load();
        return true;
      }
      return false;
    } catch (e) {
      console.error('OAuth exchange failed:', e);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [load]);

  const disconnect = useCallback(async () => {
    try {
      await authInvoke('calendar-manage', { action: 'disconnect' });
      await load();
    } catch (e) {
      console.error('Disconnect failed:', e);
    }
  }, [load]);

  const updateSettings = useCallback(async (updates: { calendar_id?: string; auto_sync?: boolean; on_delete_action?: string }) => {
    try {
      await authInvoke('calendar-manage', { action: 'update_settings', payload: updates });
      await load();
    } catch (e) {
      console.error('Update settings failed:', e);
    }
  }, [load]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data } = await authInvoke('calendar-sync', { action: 'full_sync' });
      if (data?.success) {
        const r = data;
        setSyncResult(`Sincronizado: ${r.created} creado(s), ${r.updated} actualizado(s), ${r.skipped} omitido(s), ${r.errors} error(es)`);
      } else {
        setSyncResult('Error durante la sincronización');
      }
    } catch (e) {
      setSyncResult('Error al sincronizar');
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  const loadCalendars = useCallback(async () => {
    try {
      const { data } = await authInvoke('calendar-manage', { action: 'list_calendars' });
      if (data?.calendars) setCalendars(data.calendars);
    } catch (e) {
      console.error('Failed to load calendars:', e);
    }
  }, []);

  const clearSyncResult = useCallback(() => setSyncResult(null), []);

  return {
    integrations,
    googleIntegration,
    calendars,
    loading,
    connecting,
    syncing,
    syncResult,
    connectGoogle,
    completeOAuth,
    disconnect,
    updateSettings,
    syncNow,
    loadCalendars,
    clearSyncResult,
    refresh: load,
  };
}

interface SyncLogEntry {
  id: string;
  booking_id: string | null;
  booking_code: string | null;
  action: string;
  provider: string;
  result: string;
  error_message: string | null;
  created_at: string;
}

export function useSyncLogs() {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await authInvoke('calendar-manage', { action: 'list_logs', payload: { limit: 100 } });
      if (data?.logs) setLogs(data.logs);
    } catch (e) {
      console.error('Failed to load sync logs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { logs, loading, refresh: load };
}
