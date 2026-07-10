import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  LogOut,
  Sun,
  Moon,
  RotateCcw,
  MessageSquare,
  Download,
  FileText,
  CheckCircle,
  ClipboardList,
  EyeOff,
  Menu,
  CalendarDays,
  Settings2,
  UserCog,
  MessageSquareText,
  Archive,
  LayoutDashboard,
  ExternalLink,
  Camera,
  Palette,
} from 'lucide-react';
import { supabase, Booking, AvailabilitySetting, BlockedDate, Settings, Branding } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Avatar } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { cn } from '../lib/utils';

type View = 'dashboard' | 'bookings' | 'availability' | 'settings' | 'detail' | 'trash' | 'whatsapp' | 'clients' | 'waiting' | 'profile' | 'appearance';

interface WaitingListItem {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha_deseada: string;
  horario_deseado: string | null;
  servicio: string | null;
  estado: 'pendiente' | 'contactado' | 'convertido' | 'cancelado';
  notas: string | null;
  created_at: string;
  updated_at: string;
}

function getStatusBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'info'; label: string }> = {
    confirmed: { variant: 'success', label: 'Confirmada' },
    pending: { variant: 'warning', label: 'Pendiente' },
    cancelled: { variant: 'destructive', label: 'Cancelada' },
    completed: { variant: 'info', label: 'Completada' },
  };
  return map[status] || { variant: 'warning' as const, label: status };
}

function getPaymentBadge(status: string) {
  const map: Record<string, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
    approved: { variant: 'success', label: 'Pagado' },
    pending: { variant: 'warning', label: 'Pendiente' },
    rejected: { variant: 'destructive', label: 'Rechazado' },
  };
  return map[status] || { variant: 'warning' as const, label: status };
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-login', {
        body: { email, password },
      });
      if (fnError || !data?.success) {
        setError('Email o contraseña incorrectos');
      } else {
        sessionStorage.setItem('admin_logged_in', '1');
        sessionStorage.setItem('admin_email', email);
        sessionStorage.setItem('admin_password', password);
        sessionStorage.setItem('admin_name', data.name || '');
        onLogin(email, password);
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await supabase.functions.invoke('admin-forgot-password', {
        body: { email: email.trim() },
      });
      setSuccess('Si el email existe, te enviamos una contraseña temporal. Revisá tu bandeja de entrada.');
    } catch {
      setError('Error al enviar el email. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Lock className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === 'login' ? 'Panel de Administración' : 'Recuperar contraseña'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'login' ? 'Ingresá tus credenciales para continuar' : 'Te enviamos una contraseña temporal por email'}
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleForgot} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="admin@email.com" className="h-12 text-base" />
              </div>

              {mode === 'login' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="h-12 pr-12 text-base"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-xs text-primary hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading
                  ? (mode === 'login' ? 'Ingresando...' : 'Enviando...')
                  : (mode === 'login' ? 'Ingresar' : 'Enviar contraseña temporal')}
              </Button>
            </form>

            {mode === 'forgot' && (
              <div className="mt-5 text-center">
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="text-sm font-medium text-primary hover:underline">
                  ← Volver al login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NotasAdmin({
  booking, adminEmail, adminPassword, onSaved
}: {
  booking: Booking;
  adminEmail: string;
  adminPassword: string;
  onSaved: () => void;
}) {
  const [nota, setNota] = useState((booking as any).notas_admin || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveNota = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-booking', {
        body: {
          email: adminEmail,
          password: adminPassword,
          booking_id: booking.id,
          notas_admin: nota,
        },
      });
      if (error || !data?.success) throw new Error('Error al guardar');
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium">
          📝 Notas internas
          <span className="text-xs font-normal text-muted-foreground">(solo visible para el admin)</span>
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="h-3 w-3" /> Guardado
          </span>
        )}
      </div>
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        rows={3}
        placeholder="Ej: cliente puntual / siempre llega tarde / requiere preparación especial..."
        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors duration-200"
      />
      <Button onClick={saveNota} disabled={saving} variant="secondary" size="sm">
        {saving ? 'Guardando...' : 'Guardar nota'}
      </Button>
    </div>
  );
}

// ─── Availability Manager ─────────────────────────────────────────────────────

function AvailabilityManager({
  availability, blockedDates, onRefresh, adminEmail, adminPassword, showSuccess
}: {
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
  showSuccess: (msg: string) => void;
}) {
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  const startEditing = (day: AvailabilitySetting) => {
    setEditingDay(day.day_of_week);
    setStartTime(day.start_time);
    setEndTime(day.end_time);
    setIsActive(day.is_active);
  };

  const saveDay = async () => {
    if (editingDay === null) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-availability', {
        body: { email: adminEmail, password: adminPassword, day_of_week: editingDay, start_time: startTime, end_time: endTime, is_active: isActive },
      });
      if (error || !data?.success) throw new Error('Error al guardar');
      setEditingDay(null);
      onRefresh();
      showSuccess('Horario actualizado correctamente');
    } catch {
      alert('Error al guardar');
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-blocked-dates', {
        body: { email: adminEmail, password: adminPassword, action: 'add', date: newBlockedDate, reason: newBlockedReason || null },
      });
      if (error || !data?.success) throw new Error('Error al agregar');
      setNewBlockedDate('');
      setNewBlockedReason('');
      onRefresh();
      showSuccess('Fecha bloqueada agregada');
    } catch { alert('Error al agregar fecha'); }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-blocked-dates', {
        body: { email: adminEmail, password: adminPassword, action: 'remove', id },
      });
      if (error || !data?.success) throw new Error('Error al eliminar');
      onRefresh();
    } catch { alert('Error al eliminar fecha'); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Días laborables</CardTitle>
          <CardDescription>Configurá los horarios de atención por día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {availability.map((day) => (
            <div key={day.id} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
              {editingDay === day.day_of_week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{DAYS[day.day_of_week]}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      Activo
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-12 flex-shrink-0 text-sm text-muted-foreground">Desde</span>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
                    </div>
                    <span className="hidden self-center sm:inline text-muted-foreground">a</span>
                    <div className="flex items-center gap-2">
                      <span className="w-12 flex-shrink-0 text-sm text-muted-foreground">Hasta</span>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveDay} size="sm" className="flex-1">Guardar</Button>
                    <Button onClick={() => setEditingDay(null)} variant="secondary" size="sm" className="flex-1">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${day.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{DAYS[day.day_of_week]}</span>
                    <span className="text-sm text-muted-foreground">{day.start_time.slice(0, 5)} — {day.end_time.slice(0, 5)}</span>
                  </div>
                  <Button onClick={() => startEditing(day)} variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fechas bloqueadas</CardTitle>
          <CardDescription>Días sin atención (feriados, vacaciones, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-3">
            <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} />
            <Input type="text" value={newBlockedReason} onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="Razón (opcional)" />
            <Button onClick={addBlockedDate} disabled={!newBlockedDate} className="w-full">
              Agregar fecha bloqueada
            </Button>
          </div>
          <div className="space-y-2">
            {blockedDates.map((blocked) => (
              <div key={blocked.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div>
                  <p className="font-medium">{new Date(blocked.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  {blocked.reason && <p className="text-sm text-muted-foreground">{blocked.reason}</p>}
                </div>
                <Button onClick={() => removeBlockedDate(blocked.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                </Button>
              </div>
            ))}
            {blockedDates.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No hay fechas bloqueadas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Settings Manager ─────────────────────────────────────────────────────────

function SettingsManager({
  settings, onRefresh, adminEmail, adminPassword, showSuccess
}: {
  settings: Settings;
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
  showSuccess: (msg: string) => void;
}) {
  const [price, setPrice] = useState(settings.price.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-settings', {
        body: { email: adminEmail, password: adminPassword, price, currency },
      });
      if (error || !data?.success) throw new Error('Error al guardar');
      onRefresh();
      showSuccess('Configuración guardada correctamente');
    } catch { alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Configuración general</CardTitle>
          <CardDescription>Precio y moneda de las reservas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Precio de la reserva</label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground">$</span>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="text-lg h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors">
              <option value="ARS">ARS — Peso Argentino</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="MXN">MXN — Peso Mexicano</option>
            </select>
          </div>
          <Button onClick={saveSettings} disabled={saving} size="lg" className="w-full">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Clients Manager ──────────────────────────────────────────────────────────

interface ClientData {
  name: string;
  phone: string;
  email: string;
  firstBooking: string;
  lastBooking: string;
  totalBookings: number;
}

function ClientsManager({ bookings }: { bookings: Booking[] }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const clientMap = new Map<string, ClientData>();
  bookings.forEach((b) => {
    const key = b.customer_email || b.customer_phone;
    if (clientMap.has(key)) {
      const c = clientMap.get(key)!;
      c.totalBookings += 1;
      if (b.booking_date > c.lastBooking) c.lastBooking = b.booking_date;
      if (b.booking_date < c.firstBooking) c.firstBooking = b.booking_date;
    } else {
      clientMap.set(key, {
        name: b.customer_name,
        phone: b.customer_phone,
        email: b.customer_email,
        firstBooking: b.booking_date,
        lastBooking: b.booking_date,
        totalBookings: 1,
      });
    }
  });

  let clients = Array.from(clientMap.values());

  if (search) {
    clients = clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    );
  }
  if (dateFrom) clients = clients.filter(c => c.firstBooking >= dateFrom);
  if (dateTo) clients = clients.filter(c => c.firstBooking <= dateTo);

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  const exportCSV = () => {
    const headers = ['Nombre', 'WhatsApp', 'Email', 'Primera reserva', 'Última reserva', 'Total reservas'];
    const rows = clients.map(c => [
      c.name, c.phone, c.email,
      formatDate(c.firstBooking), formatDate(c.lastBooking),
      c.totalBookings
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Listado de Clientes', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);
    let y = 40;
    const lineH = 8;
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y - 5, 182, lineH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Nombre', 16, y);
    doc.text('WhatsApp', 70, y);
    doc.text('Email', 105, y);
    doc.text('Registro', 148, y);
    doc.text('Reservas', 178, y);
    y += lineH;
    doc.setTextColor(0, 0, 0);
    clients.forEach((c, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, lineH, 'F');
      }
      doc.setFontSize(8);
      doc.text(c.name.slice(0, 20), 16, y);
      doc.text(c.phone.slice(0, 15), 70, y);
      doc.text(c.email.slice(0, 22), 105, y);
      doc.text(formatDate(c.firstBooking), 148, y);
      doc.text(String(c.totalBookings), 182, y);
      y += lineH;
    });
    doc.save('clientes.pdf');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>{clients.length} clientes encontrados</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="secondary" size="sm">
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button onClick={exportPDF} variant="destructive" size="sm">
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o teléfono..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
          </div>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 w-auto" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 w-auto" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {['Nombre', 'WhatsApp', 'Email', 'Primera reserva', 'Última reserva', 'Total'].map(h => (
                  <th key={h} className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors">
                  <td className="px-3 py-4 font-medium">{c.name}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</div>
                  </td>
                  <td className="px-3 py-4 text-sm">{formatDate(c.firstBooking)}</td>
                  <td className="px-3 py-4 text-sm">{formatDate(c.lastBooking)}</td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{c.totalBookings}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No se encontraron clientes</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── WhatsApp Manager ─────────────────────────────────────────────────────────

function WhatsAppManager({ bookings }: { bookings: Booking[] }) {
  const DEFAULT_TEMPLATE = 'Hola {nombre} 👋 Tu reserva fue aprobada. Te esperamos el día {fecha} a las {hora}. ¡Gracias!';
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState(DEFAULT_TEMPLATE);
  const [search, setSearch] = useState('');

  const pendingBookings = bookings.filter(b =>
    b.booking_status === 'pending' || b.booking_status === 'confirmed'
  );

  const filtered = pendingBookings.filter(b =>
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_phone.includes(search)
  );

  const buildMessage = (booking: Booking) => {
    const fecha = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const hora = booking.booking_time.slice(0, 5);
    return message
      .replace('{nombre}', booking.customer_name)
      .replace('{fecha}', fecha)
      .replace('{hora}', hora);
  };

  const sendWhatsApp = (booking: Booking) => {
    const phone = booking.customer_phone.replace(/\D/g, '');
    const text = encodeURIComponent(buildMessage(booking));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
              Plan Pro
            </span>
            <div>
              <p className="text-lg font-bold">Automatizá mensajes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Con el Plan Pro el cliente recibe la confirmación por WhatsApp{' '}
                <span className="font-semibold text-foreground">AUTOMÁTICAMENTE AL PAGAR</span>
                {' '}sin intervención manual,{' '}
                <span className="font-semibold text-foreground">24 hs, 7 días, feriados incluidos.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantilla del mensaje</CardTitle>
          <CardDescription>Personalizá el mensaje que se enviará por WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors duration-200" />
          <p className="text-xs text-muted-foreground">
            Variables: <code className="rounded bg-muted px-1 py-0.5">{'{nombre}'}</code>{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{fecha}'}</code>{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{hora}'}</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar reserva</CardTitle>
          <CardDescription>Elegí una reserva para enviar el mensaje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9" />
          </div>
          <div className="space-y-2">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No hay reservas disponibles</p>}
            {filtered.map((booking) => (
              <div key={booking.id}
                className={cn(
                  'rounded-lg border p-4 transition-all cursor-pointer',
                  selectedBooking?.id === booking.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => setSelectedBooking(booking === selectedBooking ? null : booking)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate">{booking.customer_name}</p>
                      <Badge variant={booking.booking_status === 'confirmed' ? 'success' : 'warning'}>
                        {booking.booking_status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Phone className="mr-1 inline h-3 w-3" />
                      {booking.customer_phone} — {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} {booking.booking_time.slice(0, 5)} hs
                    </p>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); sendWhatsApp(booking); }} size="sm" className="shrink-0">
                    <MessageSquare className="mr-1 h-4 w-4" /> Enviar
                  </Button>
                </div>
                {selectedBooking?.id === booking.id && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-1 text-xs font-medium text-primary">Vista previa:</p>
                    <p className="rounded-lg border bg-card p-3 text-sm">{buildMessage(booking)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── WaitingList Manager ──────────────────────────────────────────────────────

function WaitingListManager({
  waitingList, onRefresh, adminEmail, adminPassword
}: {
  waitingList: WaitingListItem[];
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
}) {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [saving, setSaving] = useState<string | null>(null);

  const updateItem = async (id: string, estado?: string, action?: string) => {
    setSaving(id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-waiting-list', {
        body: { email: adminEmail, password: adminPassword, id, estado, action },
      });
      if (error || !data?.success) throw new Error('Error');
      onRefresh();
    } catch {
      alert('Error al actualizar');
    } finally {
      setSaving(null);
    }
  };

  const estadoBadge: Record<string, 'warning' | 'info' | 'success' | 'destructive'> = {
    pendiente: 'warning',
    contactado: 'info',
    convertido: 'success',
    cancelado: 'destructive',
  };

  const estadoLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    contactado: 'Contactado',
    convertido: 'Convertido',
    cancelado: 'Cancelado',
  };

  const filtered = waitingList.filter(w => {
    const matchesSearch = w.nombre.toLowerCase().includes(search.toLowerCase()) ||
      w.telefono.includes(search) || w.email.toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filterEstado === 'all' || w.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Lista de espera</CardTitle>
            <CardDescription>
              {waitingList.filter(w => w.estado === 'pendiente').length} pendientes de {waitingList.length} total
            </CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre, teléfono o email..." value={search}
              onChange={e => setSearch(e.target.value)} className="h-10 pl-9" />
          </div>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors">
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="convertido">Convertido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">No hay registros en la lista de espera</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.nombre}</p>
                      <Badge variant={estadoBadge[item.estado] || 'secondary'}>
                        {estadoLabel[item.estado]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Phone className="mr-1 inline h-3 w-3" />{item.telefono}
                      <span className="mx-2">·</span>
                      <Mail className="mr-1 inline h-3 w-3" />{item.email}
                      <span className="mx-2">·</span>
                      <Calendar className="mr-1 inline h-3 w-3" />{formatDate(item.fecha_deseada)}
                      {item.horario_deseado && <span className="ml-2">{item.horario_deseado.slice(0, 5)} hs</span>}
                      {item.servicio && <span className="ml-2">· {item.servicio}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.estado === 'pendiente' && (
                      <Button onClick={() => updateItem(item.id, 'contactado')} disabled={saving === item.id}
                        variant="secondary" size="sm">
                        Contactar
                      </Button>
                    )}
                    {(item.estado === 'pendiente' || item.estado === 'contactado') && (
                      <Button onClick={() => updateItem(item.id, 'convertido')} disabled={saving === item.id}
                        size="sm">
                        Convertido
                      </Button>
                    )}
                    {item.estado !== 'cancelado' && item.estado !== 'convertido' && (
                      <Button onClick={() => updateItem(item.id, 'cancelado')} disabled={saving === item.id}
                        variant="outline" size="sm" className="text-destructive">
                        Cancelar
                      </Button>
                    )}
                    <Button onClick={() => updateItem(item.id, undefined, 'delete')} disabled={saving === item.id}
                      variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Profile Manager ───────────────────────────────────────────────────────────

function ProfileManager({
  adminEmail, adminPassword, adminName, avatarUrl, onRefresh, showSuccess, onProfileUpdated, onAvatarChange
}: {
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  avatarUrl: string;
  onRefresh: () => void;
  showSuccess: (msg: string) => void;
  onProfileUpdated: (name: string, email: string, password: string) => void;
  onAvatarChange: (url: string) => void;
}) {
  const [name, setName] = useState(adminName);
  const [email, setEmail] = useState(adminEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar-${adminEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: false });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(uploadError.message || 'Error al subir');
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const cacheBuster = `?t=${Date.now()}`;
      const publicUrl = (urlData?.publicUrl || '') + cacheBuster;
      console.log('Avatar public URL:', publicUrl);
      onAvatarChange(publicUrl);
      showSuccess('Imagen de perfil actualizada');
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err instanceof Error ? `Error: ${err.message}` : 'Error al subir la imagen');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    onAvatarChange('');
    showSuccess('Imagen de perfil eliminada');
  };

  const handleSave = async () => {
    setError('');

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Ingresá un email válido');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-update-profile', {
        body: {
          email: adminEmail,
          password: adminPassword,
          name: name.trim(),
          newEmail: email.trim() !== adminEmail ? email.trim() : null,
          newPassword: newPassword || null,
        },
      });

      if (fnError || !data?.success) {
        setError(data?.error || 'Error al guardar el perfil');
        return;
      }

      sessionStorage.setItem('admin_email', email.trim());
      sessionStorage.setItem('admin_name', name.trim());
      if (newPassword) {
        sessionStorage.setItem('admin_password', newPassword);
      }

      onProfileUpdated(name.trim(), email.trim(), newPassword || adminPassword);
      onRefresh();
      showSuccess('Perfil actualizado correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
          <CardDescription>Actualizá tus datos de administrador</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar
                  fallback={name.charAt(0).toUpperCase() || 'A'}
                  src={avatarUrl || null}
                  className="h-24 w-24 rounded-full ring-4 ring-background shadow-xl"
                />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
                  <Camera className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">200×200px recomendado · Máx 2MB</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  size="sm"
                >
                  {uploading ? 'Subiendo...' : avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                </Button>
                {avatarUrl && (
                  <Button onClick={removeAvatar} variant="ghost" size="sm" className="text-destructive">
                    Eliminar
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
            </div>

            <Separator />
            <p className="text-sm text-muted-foreground">
              Dejá los campos en blanco si no querés cambiar la contraseña.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva contraseña</label>
              <div className="relative">
                <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" className="h-12 pr-12" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar nueva contraseña</label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" className="h-12 pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Appearance (Branding) Manager ─────────────────────────────────────────────

const COLOR_PALETTES = [
  { name: 'Verde Esmeralda', primary: '#059669', bg: '#111827', card: '#1f2937', text: '#f3f4f6', muted: '#9ca3af' },
  { name: 'Azul Cobalto', primary: '#2563eb', bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', muted: '#94a3b8' },
  { name: 'Violeta Real', primary: '#7c3aed', bg: '#1e1b4b', card: '#2e1065', text: '#f3f4f6', muted: '#9ca3af' },
  { name: 'Rosa Elegante', primary: '#be185d', bg: '#1a0f14', card: '#2d1b24', text: '#fce7f3', muted: '#d4a3b3' },
  { name: 'Terracota', primary: '#c2410c', bg: '#1c1109', card: '#2d1a0f', text: '#f3f4f6', muted: '#b89a8a' },
  { name: 'Gris Pizarra', primary: '#475569', bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', muted: '#64748b' },
];

function hexToHover(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - 30);
  const g = Math.max(0, ((num >> 8) & 0xFF) - 30);
  const b = Math.max(0, (num & 0xFF) - 30);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function AppearanceManager({
  branding, onRefresh, adminEmail, adminPassword, showSuccess
}: {
  branding: Branding | null;
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
  showSuccess: (msg: string) => void;
}) {
  const [logoUrl, setLogoUrl] = useState(branding?.logo_url || '');
  const [title, setTitle] = useState(branding?.title || 'Reserva tu Turno');
  const [subtitle, setSubtitle] = useState(branding?.subtitle || 'Sistema de Reserva');
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || '#059669');
  const [bgColor, setBgColor] = useState(branding?.background_color || '#111827');
  const [cardBgColor, setCardBgColor] = useState(branding?.card_bg_color || '#1f2937');
  const [textColor, setTextColor] = useState(branding?.text_color || '#f3f4f6');
  const [mutedColor, setMutedColor] = useState(branding?.muted_color || '#9ca3af');
  const [bgImageUrl, setBgImageUrl] = useState(branding?.background_image_url || '');
  const [bgOpacity, setBgOpacity] = useState(branding?.bg_opacity ?? 80);
  const [overlayColor, setOverlayColor] = useState(branding?.overlay_color || branding?.background_color || '#111827');
  const [saving, setSaving] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<number>(-1);
  const [uploading, setUploading] = useState({ logo: false, bg: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const applyPalette = (index: number) => {
    const p = COLOR_PALETTES[index];
    setSelectedPalette(index);
    setPrimaryColor(p.primary);
    setBgColor(p.bg);
    setCardBgColor(p.card);
    setTextColor(p.text);
    setMutedColor(p.muted);
  };

  const uploadFile = async (file: File, type: 'logo' | 'bg') => {
    const bucket = 'branding';
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${type}-${Date.now()}.${ext}`;

    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const publicUrl = (urlData?.publicUrl || '') + `?t=${Date.now()}`;

      if (type === 'logo') setLogoUrl(publicUrl);
      else setBgImageUrl(publicUrl);
    } catch (err) {
      console.error(`Upload ${type} error:`, err);
      showSuccess(`Error al subir ${type === 'logo' ? 'logo' : 'fondo'}. Verificá que exista el bucket "${bucket}" en Supabase.`);
    } finally {
      if (type === 'logo' && fileInputRef.current) fileInputRef.current.value = '';
      if (type === 'bg' && bgFileInputRef.current) bgFileInputRef.current.value = '';
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      const data = {
        email: adminEmail,
        password: adminPassword,
        logo_url: logoUrl,
        title,
        subtitle,
        primary_color: primaryColor,
        background_color: bgColor,
        card_bg_color: cardBgColor,
        text_color: textColor,
        muted_color: mutedColor,
        background_image_url: bgImageUrl,
        bg_opacity: bgOpacity,
        overlay_color: overlayColor,
      };

      const { data: res, error } = await supabase.functions.invoke('admin-update-branding', {
        body: data,
      });

      if (error || !res?.success) {
        showSuccess(res?.error || 'Error al guardar');
        return;
      }

      onRefresh();
      showSuccess('Apariencia guardada correctamente');
    } catch {
      showSuccess('Error al conectar con el servidor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Preview */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>Así se ve la página de reservas actualmente</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="min-h-[120px] px-6 py-4 flex items-center"
            style={{ backgroundColor: bgColor, backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="flex items-center gap-3" style={{ backgroundColor: bgImageUrl ? 'rgba(0,0,0,0.5)' : cardBgColor, padding: '12px 16px', borderRadius: '12px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: primaryColor }}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
              <div>
                <span className="text-xl font-bold" style={{ color: textColor }}>{title || 'Reserva tu Turno'}</span>
                <p className="text-sm" style={{ color: mutedColor }}>{subtitle || 'Sistema de Reserva'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Personalizar apariencia</CardTitle>
          <CardDescription>Logo, colores y fondo de la página pública de reservas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden border" style={{ backgroundColor: primaryColor }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading.logo} variant="outline" size="sm">
                  {uploading.logo ? 'Subiendo...' : logoUrl ? 'Cambiar' : 'Subir logo'}
                </Button>
                {logoUrl && (
                  <Button onClick={() => setLogoUrl('')} variant="ghost" size="sm" className="text-destructive">
                    Eliminar
                  </Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'logo'); }} />
            </div>
          </div>

          <Separator />

          {/* Texts */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título principal</label>
              <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12" placeholder="Reserva tu Turno" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtítulo</label>
              <Input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="h-12" placeholder="Sistema de Reserva" />
            </div>
          </div>

          <Separator />

          {/* Color Palettes */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Paletas de colores</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {COLOR_PALETTES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => applyPalette(i)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 hover:shadow-md ${
                    selectedPalette === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: p.bg }}
                >
                  <div className="flex gap-1">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: p.primary }} />
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: p.muted }} />
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: p.card }} />
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: p.bg }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#e5e7eb' }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Color principal (botones, acentos)</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                <Input type="text" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-12 font-mono" placeholder="#059669" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de fondo (página)</label>
              <div className="flex items-center gap-3">
                <input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                <Input type="text" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-12 font-mono" placeholder="#111827" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de encabezado y pie de página</label>
              <div className="flex items-center gap-3">
                <input type="color" value={cardBgColor} onChange={(e) => { setCardBgColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                <Input type="text" value={cardBgColor} onChange={(e) => { setCardBgColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-12 font-mono" placeholder="#1f2937" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color de título</label>
              <div className="flex items-center gap-3">
                <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                <Input type="text" value={textColor} onChange={(e) => { setTextColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-12 font-mono" placeholder="#f3f4f6" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Color de subtítulos y textos secundarios</label>
              <div className="flex items-center gap-3">
                <input type="color" value={mutedColor} onChange={(e) => { setMutedColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                <Input type="text" value={mutedColor} onChange={(e) => { setMutedColor(e.target.value); setSelectedPalette(-1); }}
                  className="h-12 font-mono" placeholder="#9ca3af" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Background Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Imagen de fondo (opcional)</label>
            {bgImageUrl && (
              <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl">
                <img src={bgImageUrl} alt="Fondo" className="h-full w-full object-cover" />
                <button onClick={() => setBgImageUrl('')}
                  className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => bgFileInputRef.current?.click()} disabled={uploading.bg} variant="outline" size="sm">
                {uploading.bg ? 'Subiendo...' : bgImageUrl ? 'Cambiar fondo' : 'Subir fondo'}
              </Button>
              <span className="text-xs text-muted-foreground self-center">1920×1080 recomendado · Máx 5MB</span>
            </div>
            <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'bg'); }} />
          </div>

          {/* Overlay Color & Opacity */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Capa de superposición (overlay)</label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border bg-transparent p-0.5" />
                  <Input type="text" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)}
                    className="h-12 font-mono" placeholder="#111827" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Opacidad ({bgOpacity}%)</label>
                <input type="range" min="0" max="100" value={bgOpacity}
                  onChange={(e) => setBgOpacity(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: primaryColor }} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Transparente</span>
                  <span>Opaco</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <Button onClick={saveBranding} disabled={saving} size="lg" className="w-full">
            {saving ? 'Guardando...' : 'Guardar apariencia'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sidebar Navigation ──────────────────────────────────────────────────────

interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem('admin_logged_in'));
  const [adminEmail, setAdminEmail] = useState(sessionStorage.getItem('admin_email') || '');
  const [adminPassword, setAdminPassword] = useState(sessionStorage.getItem('admin_password') || '');
  const [adminName, setAdminName] = useState(sessionStorage.getItem('admin_name') || '');
  const [adminAvatar, setAdminAvatar] = useState(sessionStorage.getItem('admin_avatar') || '');
  const [view, setView] = useState<View>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deletedBookings, setDeletedBookings] = useState<Booking[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('admin_dark');
    const isDark = stored !== null ? stored === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    return isDark;
  });

  useEffect(() => {
    localStorage.setItem('admin_dark', darkMode ? '1' : '0');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, availRes, blockedRes, settingsRes, brandingRes] = await Promise.all([
        supabase.from('bookings').select('*').order('booking_date', { ascending: true }),
        supabase.from('availability_settings').select('*').order('day_of_week'),
        supabase.from('blocked_dates').select('*').order('date'),
        supabase.from('settings').select('*').maybeSingle(),
        supabase.from('branding').select('*').maybeSingle(),
      ]);
      if (bookingsRes.data) {
        const active = bookingsRes.data.filter((b: any) => !b.deleted_at);
        const deleted = bookingsRes.data.filter((b: any) => !!b.deleted_at);
        setBookings(active);
        setDeletedBookings(deleted);
      }
      if (availRes.data) setAvailability(availRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
      if (brandingRes.data) setBranding(brandingRes.data);

      const { data: wlData } = await supabase.functions.invoke('admin-get-waiting-list', {
        body: { email: adminEmail, password: adminPassword },
      });
      if (wlData?.success) setWaitingList(wlData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (email: string, password: string) => {
    setAdminEmail(email);
    setAdminPassword(password);
    setAdminName(sessionStorage.getItem('admin_name') || '');
    setAdminAvatar(sessionStorage.getItem('admin_avatar') || '');
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_email');
    sessionStorage.removeItem('admin_password');
    sessionStorage.removeItem('admin_avatar');
    setLoggedIn(false);
  };

  const updateBookingStatus = async (id: string, status: Booking['booking_status']) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-booking', {
        body: { email: adminEmail, password: adminPassword, booking_id: id, booking_status: status },
      });
      if (error || !data?.success) throw new Error('Error al actualizar');
      loadData();
    } catch {
      alert('Error al actualizar la reserva');
    }
  };

  const deleteBooking = async (id: string) => {
    setConfirmModal({
      open: true,
      message: 'Esta reserva se moverá a la papelera y se eliminará definitivamente en 3 semanas.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
        try {
          const { data, error } = await supabase.functions.invoke('admin-delete-booking', {
            body: { email: adminEmail, password: adminPassword, booking_id: id },
          });
          if (error || !data?.success) throw new Error('Error al eliminar');
          loadData();
        } catch {
          alert('Error al eliminar la reserva');
        }
      },
    });
  };

  const restoreBooking = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-restore-booking', {
        body: { email: adminEmail, password: adminPassword, booking_id: id },
      });
      if (error || !data?.success) throw new Error('Error al restaurar');
      loadData();
    } catch {
      alert('Error al restaurar la reserva');
    }
  };

  const purgeBooking = async (id: string) => {
    setConfirmModal({
      open: true,
      message: 'Esta reserva se eliminará definitivamente y no se podrá recuperar.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
        try {
          const { data, error } = await supabase.functions.invoke('admin-purge-bookings', {
            body: { email: adminEmail, password: adminPassword, booking_id: id },
          });
          if (error || !data?.success) throw new Error('Error al eliminar');
          loadData();
        } catch {
          alert('Error al eliminar definitivamente');
        }
      },
    });
  };

  const daysUntilPurge = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const purgeDate = new Date(deleted);
    purgeDate.setDate(purgeDate.getDate() + 21);
    const diff = Math.ceil((purgeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_phone.includes(searchTerm) ||
      b.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.booking_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.booking_date > todayStr);
  const paidBookings = bookings.filter((b) => b.payment_status === 'approved');
  const pendingPayments = bookings.filter((b) => b.payment_status === 'pending');

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Principal', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'bookings', label: 'Reservas', icon: <CalendarDays className="h-5 w-5" /> },
    { id: 'clients', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
    {
      id: 'waiting', label: 'Lista de espera', icon: <ClipboardList className="h-5 w-5" />,
      badge: waitingList.filter(w => w.estado === 'pendiente').length || undefined,
    },
    { id: 'availability', label: 'Disponibilidad', icon: <Clock className="h-5 w-5" /> },
    { id: 'settings', label: 'Configuración', icon: <Settings2 className="h-5 w-5" /> },
    { id: 'appearance', label: 'Apariencia', icon: <Palette className="h-5 w-5" /> },
    { id: 'profile', label: 'Perfil', icon: <UserCog className="h-5 w-5" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquareText className="h-5 w-5" /> },
    {
      id: 'trash', label: 'Papelera', icon: <Archive className="h-5 w-5" />,
      badge: deletedBookings.length || undefined,
    },
  ];

  const viewTitles: Record<View, string> = {
    dashboard: 'Panel Principal',
    bookings: 'Reservas',
    clients: 'Clientes',
    waiting: 'Lista de Espera',
    availability: 'Disponibilidad',
    settings: 'Configuración',
    appearance: 'Apariencia',
    profile: 'Perfil',
    whatsapp: 'WhatsApp',
    trash: 'Papelera',
    detail: 'Detalle de Reserva',
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const currentViewTitle = viewTitles[view];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
        {/* Sidebar header */}
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <Avatar
            fallback={adminName.charAt(0).toUpperCase() || 'A'}
            src={adminAvatar || null}
            className="h-10 w-10 rounded-xl"
          />
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight">Reserva Única</span>
            <span className="text-xs text-muted-foreground">Panel de Administración</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}>
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium min-w-[20px]',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-3 space-y-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{currentViewTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <ExternalLink className="h-4 w-4" />
              <span>Página de Reservas</span>
            </a>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Avatar fallback={adminName.charAt(0).toUpperCase() || 'A'} src={adminAvatar || null} className="h-8 w-8" />
              <span className="hidden text-sm font-medium sm:block">{adminName || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* ─── Dashboard ──────────────────────────────────────── */}
          {view === 'dashboard' && (
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="transition-all duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  onClick={() => setView('bookings')}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold">{todaysBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Reservas hoy</p>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  onClick={() => setView('bookings')}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                      <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Reservas futuras</p>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  onClick={() => setView('bookings')}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/50">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-3xl font-bold">{paidBookings.length}</p>
                    <p className="text-sm text-muted-foreground">Reservas pagadas</p>
                  </CardContent>
                </Card>
                <Card className="transition-all duration-200 hover:shadow-md active:scale-[0.99] cursor-pointer"
                  onClick={() => setView('bookings')}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/50">
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold">{pendingPayments.length}</p>
                    <p className="text-sm text-muted-foreground">Pagos pendientes</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Reservas de hoy</CardTitle>
                  <CardDescription>
                    {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaysBookings.length > 0 ? (
                    <div className="space-y-2">
                      {todaysBookings.map((booking) => (
                        <div key={booking.id}
                          className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
                          onClick={() => { setSelectedBooking(booking); setView('detail'); }}>
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                              <span className="font-bold text-primary">{booking.booking_time.slice(0, 5)}</span>
                            </div>
                            <div>
                              <p className="font-medium">{booking.customer_name}</p>
                              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />{booking.customer_phone}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No hay reservas para hoy</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximas reservas</CardTitle>
                  <CardDescription>Las próximas 5 reservas agendadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id}
                          className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
                          onClick={() => { setSelectedBooking(booking); setView('detail'); }}>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">
                                {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                              </p>
                              <p className="text-xl font-bold">{new Date(booking.booking_date + 'T12:00:00').getDate()}</p>
                            </div>
                            <div>
                              <p className="font-medium">{booking.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{booking.booking_time} hs</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <CalendarDays className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No hay reservas futuras</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Bookings ──────────────────────────────────────── */}
          {view === 'bookings' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="text" placeholder="Buscar por nombre, teléfono, email o código..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)} className="h-10 pl-9" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors">
                    <option value="all">Todos los estados</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                  <Button onClick={loadData} variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Código</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Cliente</th>
                        <th className="hidden px-4 py-4 text-left text-sm font-medium text-muted-foreground md:table-cell">Contacto</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Fecha</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Hora</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Pago</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">Estado</th>
                        <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{booking.booking_code}</td>
                          <td className="px-4 py-4 font-medium">{booking.customer_name}</td>
                          <td className="hidden px-4 py-4 md:table-cell">
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.customer_phone}</div>
                              <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{booking.customer_email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                          <td className="px-4 py-4 text-sm">{booking.booking_time}</td>
                          <td className="px-4 py-4">
                            <Badge variant={getPaymentBadge(booking.payment_status).variant}>
                              {getPaymentBadge(booking.payment_status).label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={getStatusBadge(booking.booking_status).variant}>
                              {getStatusBadge(booking.booking_status).label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button onClick={() => { setSelectedBooking(booking); setView('detail'); }}
                                variant="ghost" size="icon" title="Ver detalle">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {booking.booking_status === 'pending' && (
                                <Button onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                  variant="ghost" size="icon" title="Confirmar" className="text-emerald-600">
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              )}
                              {booking.booking_status === 'confirmed' && (
                                <Button onClick={() => updateBookingStatus(booking.id, 'completed')}
                                  variant="ghost" size="icon" title="Completar" className="text-blue-600">
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                                <Button onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                  variant="ghost" size="icon" title="Cancelar" className="text-destructive">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {(booking.booking_status === 'cancelled' || booking.booking_status === 'completed') && (
                                <Button onClick={() => deleteBooking(booking.id)}
                                  variant="ghost" size="sm" className="text-destructive" title="Eliminar">
                                  <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && (
                    <p className="py-12 text-center text-sm text-muted-foreground">No se encontraron reservas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Detail ─────────────────────────────────────────── */}
          {view === 'detail' && selectedBooking && (
            <div className="mx-auto max-w-2xl space-y-6">
              <Button onClick={() => setView('bookings')} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detalle de reserva</CardTitle>
                    <span className="font-mono text-sm text-muted-foreground">{selectedBooking.booking_code}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-lg font-semibold">{selectedBooking.customer_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />{selectedBooking.customer_phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />{selectedBooking.customer_email}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-accent p-4">
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium">{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="rounded-lg bg-accent p-4">
                        <p className="text-xs text-muted-foreground">Hora</p>
                        <p className="font-medium">{selectedBooking.booking_time} hs</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">Estado del pago</p>
                      <Badge variant={getPaymentBadge(selectedBooking.payment_status).variant}>
                        {getPaymentBadge(selectedBooking.payment_status).label}
                      </Badge>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">Monto</p>
                      <p className="text-2xl font-bold">${selectedBooking.amount.toLocaleString('es-AR')} ARS</p>
                    </div>
                  </div>

                  <Separator />

                  <NotasAdmin
                    booking={selectedBooking}
                    adminEmail={adminEmail}
                    adminPassword={adminPassword}
                    onSaved={() => loadData()}
                  />

                  <div className="flex gap-3 pt-4">
                    {selectedBooking.booking_status === 'pending' && (
                      <Button onClick={() => { updateBookingStatus(selectedBooking.id, 'confirmed'); setView('bookings'); }} className="flex-1">
                        Confirmar
                      </Button>
                    )}
                    {selectedBooking.booking_status === 'confirmed' && (
                      <Button onClick={() => { updateBookingStatus(selectedBooking.id, 'completed'); setView('bookings'); }} variant="secondary" className="flex-1">
                        Completar
                      </Button>
                    )}
                    {(selectedBooking.booking_status === 'pending' || selectedBooking.booking_status === 'confirmed') && (
                      <Button onClick={() => { updateBookingStatus(selectedBooking.id, 'cancelled'); setView('bookings'); }} variant="destructive" className="flex-1">
                        Cancelar
                      </Button>
                    )}
                    {(selectedBooking.booking_status === 'cancelled' || selectedBooking.booking_status === 'completed') && (
                      <Button onClick={() => { deleteBooking(selectedBooking.id); setView('bookings'); }} variant="destructive" className="flex-1">
                        Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Availability ───────────────────────────────────── */}
          {view === 'availability' && (
            <AvailabilityManager
              availability={availability}
              blockedDates={blockedDates}
              onRefresh={loadData}
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
            />
          )}

          {/* ─── Settings ───────────────────────────────────────── */}
          {view === 'settings' && settings && (
            <SettingsManager
              settings={settings}
              onRefresh={loadData}
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
            />
          )}

          {/* ─── Appearances ────────────────────────────────── */}
          {view === 'appearance' && (
            <AppearanceManager
              branding={branding}
              onRefresh={() => { loadData(); }}
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
            />
          )}

          {/* ─── Waiting List ───────────────────────────────────── */}
          {view === 'waiting' && (
            <WaitingListManager
              waitingList={waitingList}
              onRefresh={loadData}
              adminEmail={adminEmail}
              adminPassword={adminPassword}
            />
          )}

          {/* ─── Clients ────────────────────────────────────────── */}
          {view === 'clients' && (
            <ClientsManager bookings={bookings} />
          )}

          {/* ─── WhatsApp ───────────────────────────────────────── */}
          {view === 'whatsapp' && (
            <WhatsAppManager bookings={bookings} />
          )}

          {/* ─── Profile ────────────────────────────────────────── */}
          {view === 'profile' && (
            <ProfileManager
              adminEmail={adminEmail}
              adminPassword={adminPassword}
              adminName={adminName}
              avatarUrl={adminAvatar}
              onRefresh={loadData}
              showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
              onProfileUpdated={(name, email, password) => {
                setAdminName(name);
                setAdminEmail(email);
                setAdminPassword(password);
              }}
              onAvatarChange={(url) => {
                setAdminAvatar(url);
                sessionStorage.setItem('admin_avatar', url);
              }}
            />
          )}

          {/* ─── Trash ──────────────────────────────────────────── */}
          {view === 'trash' && (
            <div className="mx-auto max-w-3xl">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Papelera</CardTitle>
                      <CardDescription>Las reservas se eliminan definitivamente a los 21 días</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {deletedBookings.length === 0 ? (
                    <div className="py-16 text-center">
                      <Archive className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
                      <p className="text-muted-foreground">La papelera está vacía</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deletedBookings.map((booking) => {
                        const days = daysUntilPurge((booking as any).deleted_at);
                        return (
                          <div key={booking.id} className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <p className="font-medium">{booking.customer_name}</p>
                                <span className="font-mono text-xs text-muted-foreground">{booking.booking_code}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} {booking.booking_time}
                                <Badge variant={days <= 3 ? 'destructive' : 'warning'} className="ml-2">
                                  Se elimina en {days} días
                                </Badge>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <Button onClick={() => restoreBooking(booking.id)} variant="secondary" size="sm">
                                <RotateCcw className="mr-1 h-4 w-4" /> Restaurar
                              </Button>
                              <Button onClick={() => purgeBooking(booking.id)} variant="destructive" size="sm">
                                <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Success Modal */}
      <Dialog open={successModal.open} onOpenChange={(open) => !open && setSuccessModal({ open: false, message: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-center pt-4">¡Listo!</DialogTitle>
            <DialogDescription className="text-center">{successModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setSuccessModal({ open: false, message: '' })} className="w-full sm:w-auto">
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal(prev => ({ ...prev, open: false }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center pt-4">Eliminar reserva</DialogTitle>
            <DialogDescription className="text-center">{confirmModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} variant="outline">
              Cancelar
            </Button>
            <Button onClick={confirmModal.onConfirm} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
