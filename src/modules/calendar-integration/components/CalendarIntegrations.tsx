import { useState, useEffect } from 'react';
import { CalendarDays, RefreshCw, Unlink, CheckCircle2, AlertCircle, Loader2, Clock, Settings, ChevronDown, ChevronUp, ExternalLink, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { useCalendarIntegrations, useSyncLogs } from '../hooks/useCalendarIntegrations';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function CalendarIntegrations() {
  const {
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
  } = useCalendarIntegrations();

  const { logs, loading: logsLoading } = useSyncLogs();
  const [showLogs, setShowLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isGoogleConnected = googleIntegration?.is_connected === true;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      completeOAuth(code).then(success => {
        if (success) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
  }, [completeOAuth]);

  useEffect(() => {
    if (isGoogleConnected) loadCalendars();
  }, [isGoogleConnected, loadCalendars]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">Calendarios</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conectá tu calendario externo para sincronizar las reservas automáticamente.
        </p>
      </div>

      {/* Google Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-green-500">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Calendar</CardTitle>
                <CardDescription>
                  {isGoogleConnected
                    ? `Conectado${googleIntegration?.calendar_name ? ` — ${googleIntegration.calendar_name}` : ''}`
                    : 'No conectado'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isGoogleConnected ? 'success' : 'secondary'}>
              {isGoogleConnected ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Conectado</>
              ) : (
                <><AlertCircle className="mr-1 h-3 w-3" /> Desconectado</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isGoogleConnected ? (
              <Button
                onClick={connectGoogle}
                disabled={connecting}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Conectar con Google
              </Button>
            ) : (
              <>
                <Button
                  onClick={syncNow}
                  disabled={syncing}
                  variant="default"
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar ahora
                </Button>
                <Button
                  onClick={() => disconnect()}
                  variant="destructive"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              </>
            )}
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4 text-sm">
              <span>{syncResult}</span>
              <button onClick={clearSyncResult} className="text-muted-foreground hover:text-foreground">
                <AlertCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Settings (only when connected) */}
          {isGoogleConnected && (
            <div className="space-y-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configuración
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showSettings && (
                <div className="rounded-xl border border-border p-5 space-y-5">
                  {/* Calendar Selector */}
                  {calendars.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground">Calendario de destino</label>
                      <p className="text-xs text-muted-foreground mb-2">Elegí en qué calendario de Google se crearán los eventos.</p>
                      <div className="space-y-1.5">
                        {calendars.map(cal => (
                          <button
                            key={cal.id}
                            onClick={() => updateSettings({ calendar_id: cal.id })}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                              googleIntegration?.calendar_id === cal.id
                                ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
                                : 'hover:bg-muted/50 border border-transparent'
                            }`}
                          >
                            <CalendarDays className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{cal.summary}</span>
                            {cal.primary && (
                              <Badge variant="outline" className="text-[10px]">Principal</Badge>
                            )}
                            {googleIntegration?.calendar_id === cal.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto Sync Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Sincronización automática</p>
                      <p className="text-xs text-muted-foreground">Cada reserva nueva se sincroniza al instante.</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ auto_sync: !googleIntegration?.auto_sync })}
                      className="shrink-0"
                    >
                      {googleIntegration?.auto_sync ? (
                        <ToggleRight className="h-10 w-10 text-primary" />
                      ) : (
                        <ToggleLeft className="h-10 w-10 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* On Delete Action */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Al cancelar una reserva</p>
                    <p className="text-xs text-muted-foreground mb-3">Qué hacer con el evento en Google Calendar.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSettings({ on_delete_action: 'mark_cancelled' })}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                          googleIntegration?.on_delete_action === 'mark_cancelled'
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        Marcar como cancelado
                      </button>
                      <button
                        onClick={() => updateSettings({ on_delete_action: 'delete_event' })}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all border ${
                          googleIntegration?.on_delete_action === 'delete_event'
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5 inline" />
                        Eliminar evento
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Próximamente</CardTitle>
          <CardDescription>Otras integraciones de calendario en desarrollo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[
              { name: 'Microsoft Outlook', color: 'from-blue-600 to-blue-800' },
              { name: 'Apple Calendar', color: 'from-gray-400 to-gray-600' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl border border-border p-4 opacity-50">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.color}`}>
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <CardTitle className="text-lg">Historial de sincronización</CardTitle>
              <CardDescription>Últimas acciones de sincronización con Google Calendar.</CardDescription>
            </div>
            {showLogs ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showLogs && (
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay registros de sincronización.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"
                  >
                    {log.result === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        {log.action === 'created' && 'Evento creado'}
                        {log.action === 'updated' && 'Evento actualizado'}
                        {log.action === 'deleted' && 'Evento eliminado'}
                        {log.action === 'full_sync' && 'Sincronización completa'}
                        {log.action === 'error' && 'Error'}
                      </span>
                      {log.booking_code && (
                        <span className="ml-2 text-muted-foreground">— {log.booking_code}</span>
                      )}
                      {log.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{log.error_message}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      <Clock className="mr-1 h-3 w-3 inline" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
