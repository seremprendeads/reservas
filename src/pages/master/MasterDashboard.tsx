import { useEffect, useState, useCallback } from 'react';
import { masterGetToken, masterGetName, masterGetEmail, masterClearSession } from '../../lib/master-session';
import { ShieldCheck, Users, Clock, Ban, CheckCircle, LogOut, RefreshCw, ChevronDown, ChevronUp, Plus, Copy, Check } from 'lucide-react';
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

interface InviteResult {
  invite_link: string;
  temp_password: string;
  trial_ends_at: string | null;
  slug: string;
}

type ActionType = 'suspend' | 'reactivate' | 'change_plan' | 'extend_trial';

// Enum de planes — debe coincidir con CHECK constraint de la DB
const PLANS = ['free', 'pro', 'enterprise'];
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function invokeMaster(fn: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${masterGetToken()}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: data };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// ── Panel de nueva invitación ─────────────────────────────────────────────────
function CreateInvitePanel({ onDone }: { onDone: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: fnErr } = await invokeMaster('master-create-invite', {
        business_name: businessName.trim(),
        owner_email: ownerEmail.trim().toLowerCase(),
        owner_name: ownerName.trim(),
        currency,
      });
      if (fnErr || !data?.invite_link) {
        setError(data?.error || fnErr?.error || 'Error al crear la invitación');
        return;
      }
      setResult(data as InviteResult);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, type: 'link' | 'pass') => {
    await navigator.clipboard.writeText(text);
    if (type === 'link') { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }
    else { setCopiedPass(true); setTimeout(() => setCopiedPass(false), 2000); }
  };

  if (result) {
    const trialDate = result.trial_ends_at
      ? new Date(result.trial_ends_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
      : '18 días desde hoy';

    return (
      <Card className="border-0 shadow-sm mb-6 border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-base text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" /> Invitación creada exitosamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/60 p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-foreground/60 mb-1">Link de invitación (compartir al cliente)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background rounded px-3 py-2 border border-border break-all">{result.invite_link}</code>
                <button onClick={() => copyText(result.invite_link, 'link')}
                  className="shrink-0 p-2 rounded hover:bg-muted transition-colors text-foreground/60">
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-foreground/60 mb-1">Contraseña temporal (comunicar en persona, NO por escrito)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-bold tracking-widest bg-background rounded px-3 py-2 border border-border text-primary">{result.temp_password}</code>
                <button onClick={() => copyText(result.temp_password, 'pass')}
                  className="shrink-0 p-2 rounded hover:bg-muted transition-colors text-foreground/60">
                  {copiedPass ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-1">⚠ No enviar por WhatsApp/email. Decirla en persona. El cliente la cambia al primer login.</p>
            </div>
            <div className="text-xs text-foreground/60">
              Trial activo hasta: <strong>{trialDate}</strong> · Slug: <strong>/{result.slug}</strong>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setResult(null); setBusinessName(''); setOwnerEmail(''); setOwnerName(''); }}>
              Crear otra invitación
            </Button>
            <Button variant="ghost" size="sm" onClick={onDone}>Volver a tenants</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nueva invitación
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Nombre del negocio *</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} required
              placeholder="Barbería Don Juan"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Email del dueño *</label>
            <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required
              placeholder="juan@ejemplo.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Nombre del dueño *</label>
            <input value={ownerName} onChange={e => setOwnerName(e.target.value)} required
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Moneda</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="ARS">ARS (Peso argentino)</option>
              <option value="USD">USD (Dólar)</option>
              <option value="CLP">CLP (Peso chileno)</option>
              <option value="UYU">UYU (Peso uruguayo)</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={loading} size="sm">
              {loading ? 'Creando...' : 'Crear negocio e invitación'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MasterDashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'dashboard' | 'tenants'>('dashboard');
  const [showCreateInvite, setShowCreateInvite] = useState(false);
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
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
            onClick={() => { setView(v); setShowCreateInvite(false); }}
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
            {showCreateInvite ? (
              <CreateInvitePanel onDone={() => { setShowCreateInvite(false); loadTenants(); }} />
            ) : (
              <div className="flex items-center gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="sm" onClick={() => setShowCreateInvite(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nueva invitación
                </Button>
                <Button variant="ghost" size="sm" onClick={loadTenants}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
                </Button>
              </div>
            )}

            {actionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            {!showCreateInvite && (
              <div className="space-y-3">
                {filteredTenants.map((t) => {
                  const days = daysLeft(t.trial_ends_at);
                  const isExpanded = expandedTenant === t.id;
                  const statusLabel = !t.is_active ? 'Suspendido'
                    : t.is_trial ? `Trial${days !== null ? ` (${days}d)` : ''}`
                    : t.plan === 'free' ? 'Free'
                    : 'Activo';
                  const statusColor = !t.is_active ? 'bg-red-100 text-red-700'
                    : t.is_trial ? 'bg-yellow-100 text-yellow-700'
                    : t.plan === 'free' ? 'bg-gray-100 text-gray-600'
                    : 'bg-green-100 text-green-700';

                  return (
                    <Card key={t.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground truncate">{t.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                                {statusLabel}
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
                                <Button variant="destructive" size="sm" disabled={!!actionLoading}
                                  onClick={() => handleAction(t.id, 'suspend')}>
                                  {actionLoading === t.id + 'suspend' ? 'Suspendiendo...' : 'Suspender'}
                                </Button>
                              ) : (
                                <Button variant="default" size="sm" disabled={!!actionLoading}
                                  onClick={() => handleAction(t.id, 'reactivate')}>
                                  {actionLoading === t.id + 'reactivate' ? 'Reactivando...' : 'Reactivar'}
                                </Button>
                              )}

                              <Button variant="outline" size="sm" disabled={!!actionLoading}
                                onClick={() => handleAction(t.id, 'extend_trial')}>
                                {actionLoading === t.id + 'extend_trial' ? 'Extendiendo...' : 'Extender trial 18d'}
                              </Button>

                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedPlan[t.id] || t.plan}
                                  onChange={(e) => setSelectedPlan(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  className="text-xs border border-border rounded px-2 py-1.5 bg-background"
                                >
                                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <Button variant="outline" size="sm" disabled={!!actionLoading}
                                  onClick={() => handleAction(t.id, 'change_plan', selectedPlan[t.id] || t.plan)}>
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

                {filteredTenants.length === 0 && !showCreateInvite && (
                  <div className="text-center py-12 text-foreground/40">No se encontraron profesionales</div>
                )}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}