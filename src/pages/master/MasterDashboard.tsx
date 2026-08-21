import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { masterGetToken, masterGetName, masterGetEmail, masterClearSession } from '../../lib/master-session';
import { ShieldCheck, Users, Clock, Ban, CheckCircle, LogOut, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

interface DashboardStats {
  total: number;
  active: number;
  trial_active: number;
  trial_expiring_soon: number;
  suspended: number;
  free_plan: number;
  plans: Record<string, number>;
  upcoming_expirations: { id: string; trial_ends_at: string; days_left: number }[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  plan: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  created_at: string;
}

type ActionType = 'suspend' | 'reactivate' | 'change_plan' | 'extend_trial';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];

function authHeaders() {
  return { Authorization: `Bearer ${masterGetToken()}` };
}

async function invokeMaster(fn: string, body: Record<string, unknown>) {
  return supabase.functions.invoke(fn, { body, headers: authHeaders() });
}

export function MasterDashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'dashboard' | 'tenants'>('dashboard');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({});
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnErr } = await invokeMaster('master-get-dashboard', {});
      if (fnErr || !data?.stats) throw new Error('Error al cargar dashboard');
      setStats(data.stats);
    } catch {
      setError('Error al cargar datos. Verificá tu sesión.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fnErr } = await invokeMaster('master-get-tenants', {});
      if (fnErr || !data?.tenants) throw new Error('Error al cargar tenants');
      setTenants(data.tenants);
    } catch {
      setError('Error al cargar tenants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'dashboard') loadDashboard();
    else loadTenants();
  }, [view, loadDashboard, loadTenants]);

  const handleAction = async (businessId: string, action: ActionType, plan?: string) => {
    setActionLoading(businessId + action);
    setActionError('');
    try {
      const body: Record<string, unknown> = { business_id: businessId, action };
      if (plan) body.plan = plan;
      const { data, error: fnErr } = await invokeMaster('master-update-tenant', body);
      if (fnErr || !data?.success) throw new Error('Error al ejecutar acción');
      await loadTenants();
    } catch {
      setActionError('Error al ejecutar la acción. Intentá de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    masterClearSession();
    onLogout();
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const daysLeft = (date: string | null) => {
    if (!date) return null;
    const d = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return d;
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-lg text-foreground">BookingBio Master</h1>
            <p className="text-xs text-foreground/50">{masterGetEmail()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground/70">Hola, {masterGetName()}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Salir
          </Button>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b border-border bg-card px-6 flex gap-1">
        {(['dashboard', 'tenants'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === v
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            {v === 'dashboard' ? 'Dashboard' : 'Profesionales'}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48 text-foreground/50">Cargando...</div>
        ) : view === 'dashboard' && stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500' },
                { label: 'Activos', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
                { label: 'En Trial', value: stats.trial_active, icon: Clock, color: 'text-yellow-500' },
                { label: 'Vencen pronto', value: stats.trial_expiring_soon, icon: Clock, color: 'text-orange-500' },
                { label: 'Suspendidos', value: stats.suspended, icon: Ban, color: 'text-red-500' },
                { label: 'Plan Gratis', value: stats.free_plan, icon: Users, color: 'text-gray-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Icon className={`h-6 w-6 mb-2 ${color}`} />
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-foreground/60 mt-1">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Planes */}
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader><CardTitle className="text-base">Distribución de planes</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {Object.entries(stats.plans).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize text-foreground">{plan}</span>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Próximos vencimientos */}
            {stats.upcoming_expirations.length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
                <CardHeader><CardTitle className="text-base text-orange-600">⚠ Trials por vencer (≤3 días)</CardTitle></CardHeader>
                <CardContent>
                  {stats.upcoming_expirations.map((e) => (
                    <div key={e.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-foreground/70 font-mono text-xs">{e.id}</span>
                      <span className="text-orange-600 font-medium">{e.days_left} día{e.days_left !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={loadDashboard}>
                <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
              </Button>
            </div>
          </>
        ) : view === 'tenants' ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Buscar por nombre, email o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button variant="ghost" size="sm" onClick={loadTenants}>
                <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
              </Button>
            </div>

            {actionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {filteredTenants.map((t) => {
                const days = daysLeft(t.trial_ends_at);
                const isExpanded = expandedTenant === t.id;

                return (
                  <Card key={t.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      {/* Row principal */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground truncate">{t.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              !t.is_active ? 'bg-red-100 text-red-700' :
                              t.is_trial ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {!t.is_active ? 'Suspendido' : t.is_trial ? `Trial${days !== null ? ` (${days}d)` : ''}` : 'Activo'}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{t.plan}</span>
                          </div>
                          <p className="text-xs text-foreground/50 mt-0.5 truncate">{t.owner_email} · /{t.slug}</p>
                        </div>
                        <button
                          onClick={() => setExpandedTenant(isExpanded ? null : t.id)}
                          className="text-foreground/40 hover:text-foreground transition-colors shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Panel expandido de acciones */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-xs text-foreground/60">
                            <div><span className="font-medium">ID:</span> <span className="font-mono">{t.id}</span></div>
                            <div><span className="font-medium">Creado:</span> {formatDate(t.created_at)}</div>
                            <div><span className="font-medium">Trial vence:</span> {formatDate(t.trial_ends_at)}</div>
                            <div><span className="font-medium">Plan:</span> {t.plan}</div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {t.is_active ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(t.id, 'suspend')}
                              >
                                {actionLoading === t.id + 'suspend' ? 'Suspendiendo...' : 'Suspender'}
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(t.id, 'reactivate')}
                              >
                                {actionLoading === t.id + 'reactivate' ? 'Reactivando...' : 'Reactivar'}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!!actionLoading}
                              onClick={() => handleAction(t.id, 'extend_trial')}
                            >
                              {actionLoading === t.id + 'extend_trial' ? 'Extendiendo...' : 'Extender trial 18d'}
                            </Button>

                            <div className="flex items-center gap-2">
                              <select
                                value={selectedPlan[t.id] || t.plan}
                                onChange={(e) => setSelectedPlan(prev => ({ ...prev, [t.id]: e.target.value }))}
                                className="text-xs border border-border rounded px-2 py-1.5 bg-background"
                              >
                                {PLANS.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(t.id, 'change_plan', selectedPlan[t.id] || t.plan)}
                              >
                                {actionLoading === t.id + 'change_plan' ? 'Cambiando...' : 'Cambiar plan'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTenants.length === 0 && (
                <div className="text-center py-12 text-foreground/40">No se encontraron profesionales</div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
