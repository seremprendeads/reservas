import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  LogOut,
  Sun,
  Moon,
  MessageSquare,
  FileText,
  CheckCircle,
  ClipboardList,
  EyeOff,
} from 'lucide-react';
import { supabase, Booking, AvailabilitySetting, BlockedDate, Settings } from '../lib/supabase';

type View = 'dashboard' | 'bookings' | 'availability' | 'settings' | 'detail' | 'trash' | 'whatsapp' | 'clients' | 'waiting';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// Mapas estáticos para clases seguras de Tailwind
const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
};

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
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="mb-1 text-2xl font-bold text-center text-gray-800">
          {mode === 'login' ? 'Panel Admin' : 'Recuperar contraseña'}
        </h1>
        <p className="mb-6 text-sm text-center text-gray-500">
          {mode === 'login' ? 'Ingresá tus credenciales para continuar' : 'Te enviamos una contraseña temporal por email'}
        </p>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 border border-red-200 bg-red-50 rounded-xl">
            <XCircle className="flex-shrink-0 w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 mb-4 border border-green-200 bg-green-50 rounded-xl">
            <CheckCircle className="flex-shrink-0 w-5 h-5 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleForgot} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="admin@email.com"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none" />
          </div>

          {mode === 'login' && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 text-base border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-xs text-emerald-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 mt-2 text-lg font-semibold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {loading
              ? (mode === 'login' ? 'Ingresando...' : 'Enviando...')
              : (mode === 'login' ? 'Ingresar' : 'Enviar contraseña temporal')}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="mt-5 text-center">
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-sm font-medium text-emerald-600 hover:underline">
              ← Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem('admin_logged_in'));
  const [adminEmail, setAdminEmail] = useState(sessionStorage.getItem('admin_email') || '');
  const [adminPassword, setAdminPassword] = useState(sessionStorage.getItem('admin_password') || '');
  const [view, setView] = useState<View>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [deletedBookings, setDeletedBookings] = useState<Booking[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    if (loggedIn) loadData();
  }, [loggedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, availRes, blockedRes, settingsRes] = await Promise.all([
        supabase.from('bookings').select('*').order('booking_date', { ascending: true }),
        supabase.from('availability_settings').select('*').order('day_of_week'),
        supabase.from('blocked_dates').select('*').order('date'),
        supabase.from('settings').select('*').maybeSingle(),
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
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_logged_in');
    sessionStorage.removeItem('admin_email');
    sessionStorage.removeItem('admin_password');
    setLoggedIn(false);
  };

  const updateBookingStatus = async (id: string, status: Booking['booking_status']) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-booking', {
        body: { email: adminEmail, password: adminPassword, booking_id: id, booking_status: status },
      });
      if (error || !data?.success) throw new Error('Error al actualizar');
      loadData();
    } catch (error) {
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

  // Clientes únicos basados en email/teléfono
  const uniqueClients = Array.from(new Map(bookings.map(b => [b.customer_email, b])).values());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.booking_date > todayStr);
  const paidBookings = bookings.filter((b) => b.payment_status === 'approved');
  const pendingPayments = bookings.filter((b) => b.payment_status === 'pending');

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('admin_dark') === '1');

  useEffect(() => {
    localStorage.setItem('admin_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm sticky top-0 z-40 border-b`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Administración</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CRM de Reservas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className={`flex items-center gap-2 px-4 py-2 transition-colors rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Página de Reservas</span>
              </a>
              <button onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={handleLogout} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:text-red-400 hover:bg-gray-700' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}>
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2 mb-6 text-center">
          {[
            { id: 'dashboard', label: 'Principal', icon: null },
            { id: 'bookings', label: 'Reservas', icon: <Users className="w-5 h-5" /> },
            { id: 'clients', label: 'Clientes', icon: <FileText className="w-5 h-5" /> },
            { id: 'waiting', label: `Lista de espera ${waitingList.filter(w => w.estado === 'pendiente').length > 0 ? `(${waitingList.filter(w => w.estado === 'pendiente').length})` : ''}`, icon: <ClipboardList className="w-5 h-5" /> },
            { id: 'availability', label: 'Disponibilidad', icon: <Clock className="w-5 h-5" /> },
            { id: 'settings', label: 'Configuración', icon: <DollarSign className="w-5 h-5" /> },
            { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-5 h-5" /> },
            { id: 'trash', label: `Papelera ${deletedBookings.length > 0 ? `(${deletedBookings.length})` : ''}`, icon: <Trash2 className="w-5 h-5" /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id as View)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === tab.id ? 'bg-emerald-600 text-white shadow-lg' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Reservas hoy', value: todaysBookings.length, color: 'blue', icon: <Calendar className="w-6 h-6 text-blue-600" /> },
                { label: 'Reservas futuras', value: upcomingBookings.length, color: 'emerald', icon: <Users className="w-6 h-6 text-emerald-600" /> },
                { label: 'Reservas pagadas', value: paidBookings.length, color: 'green', icon: <DollarSign className="w-6 h-6 text-green-600" /> },
                { label: 'Pagos pendientes', value: pendingPayments.length, color: 'yellow', icon: <AlertCircle className="w-6 h-6 text-yellow-600" /> },
              ].map((stat) => {
                const colors = colorMap[stat.color] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                  <div key={stat.label} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>{stat.icon}</div>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stat.value}</p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
              <h2 className="text-xl font-bold mb-4">Reservas de hoy</h2>
              {todaysBookings.length > 0 ? (
                <div className="space-y-3">
                  {todaysBookings.map((booking) => (
                    <div key={booking.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                          <span className="font-bold text-emerald-600">{booking.booking_time.slice(0, 5)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-lg">{booking.customer_name}</p>
                          <p className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><Phone className="w-4 h-4" />{booking.customer_phone}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}>
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-8 text-gray-500">No hay reservas para hoy</p>}
            </div>

            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
              <h2 className="text-xl font-bold mb-4">Próximas reservas</h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}</p>
                          <p className="text-xl font-bold">{new Date(booking.booking_date + 'T12:00:00').getDate()}</p>
                        </div>
                        <div>
                          <p className="font-medium">{booking.customer_name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{booking.booking_time} hs</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}>
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center py-8 text-gray-500">No hay reservas futuras</p>}
            </div>
          </div>
        )}

        {/* Bookings */}
        {view === 'bookings' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
            <div className="flex flex-col gap-4 mb-6 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                <input type="text" placeholder="Buscar por nombre, teléfono, email o código..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl text-base focus:border-emerald-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-3 border rounded-xl text-base focus:border-emerald-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
                <option value="all">Todos los estados</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <button onClick={loadData} className={`flex items-center gap-2 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Código</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-left py-4 px-3 font-medium hidden md:table-cell text-gray-500">Contacto</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Fecha</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Hora</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Pago</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Estado</th>
                    <th className="text-center py-4 px-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="py-4 px-3 font-mono text-sm">{booking.booking_code}</td>
                      <td className="py-4 px-3 font-medium">{booking.customer_name}</td>
                      <td className="hidden px-3 py-4 md:table-cell">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer_phone}</div>
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customer_email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-3">{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className="py-4 px-3">{booking.booking_time}</td>
                      <td className="px-3 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.payment_status === 'approved' ? 'bg-green-100 text-green-700' : booking.payment_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {booking.payment_status === 'approved' ? 'Pagado' : booking.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.booking_status === 'completed' ? 'bg-blue-100 text-blue-700' : booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {booking.booking_status === 'confirmed' ? 'Confirmada' : booking.booking_status === 'completed' ? 'Completada' : booking.booking_status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`} title="Ver detalle"><Eye className="w-4 h-4" /></button>
                          {booking.booking_status === 'pending' && (
                            <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="p-2 rounded-lg hover:bg-green-100" title="Confirmar"><Calendar className="w-4 h-4 text-green-600" /></button>
                          )}
                          {booking.booking_status === 'confirmed' && (
                            <button onClick={() => updateBookingStatus(booking.id, 'completed')} className="p-2 rounded-lg hover:bg-blue-100" title="Completar"><Clock className="w-4 h-4 text-blue-600" /></button>
                          )}
                          {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                            <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="p-2 rounded-lg hover:bg-red-100" title="Cancelar"><XCircle className="w-4 h-4 text-red-600" /></button>
                          )}
                          {(booking.booking_status === 'cancelled' || booking.booking_status === 'completed') && (
                            <button onClick={() => deleteBooking(booking.id)} className="p-2 rounded-lg hover:bg-red-100" title="Eliminar"><Trash2 className="w-4 h-4 text-red-600" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && <p className="text-center py-12 text-gray-500">No se encontraron reservas</p>}
            </div>
          </div>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedBooking && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setView('bookings')} className={`flex items-center gap-2 mb-6 transition-colors ${darkMode ? 'text-gray-300 hover:text-emerald-500' : 'text-gray-600 hover:text-emerald-600'}`}>
              <ArrowLeft className="w-5 h-5" /> Volver a reservas
            </button>
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-8 border shadow-sm rounded-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Detalle de reserva</h2>
                <span className="font-mono text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-lg">{selectedBooking.booking_code}</span>
              </div>
              <div className="grid gap-6 mb-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-lg font-bold">{selectedBooking.customer_name}</p>
                  <div className="flex items-center gap-2 text-gray-500"><Phone className="w-5 h-5" />{selectedBooking.customer_phone}</div>
                  <div className="flex items-center gap-2 text-gray-500"><Mail className="w-5 h-5" />{selectedBooking.customer_email}</div>
                </div>
                <div className="space-y-3">
                  <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-emerald-50'} rounded-xl`}>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Fecha</p>
                    <p className="font-medium">{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-emerald-50'} rounded-xl`}>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Hora de atención</p>
                    <p className="font-medium">{selectedBooking.booking_time} hs</p>
                  </div>
                </div>
              </div>
              <hr className={`my-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
              <div className="flex flex-wrap gap-2">
                {selectedBooking.booking_status === 'pending' && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'confirmed'); setView('bookings'); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">Confirmar Turno</button>
                )}
                {selectedBooking.booking_status === 'confirmed' && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'completed'); setView('bookings'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">Marcar como Completado</button>
                )}
                {selectedBooking.booking_status !== 'cancelled' && selectedBooking.booking_status !== 'completed' && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'cancelled'); setView('bookings'); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">Cancelar Reserva</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clients View */}
        {view === 'clients' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
            <h2 className="text-xl font-bold mb-4">Directorio de Clientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Nombre Completo</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Teléfono</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Email</th>
                    <th className="text-center py-4 px-3 font-medium text-gray-500">Historial</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {uniqueClients.map((client) => (
                    <tr key={client.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="py-4 px-3 font-medium">{client.customer_name}</td>
                      <td className="py-4 px-3">{client.customer_phone}</td>
                      <td className="py-4 px-3">{client.customer_email}</td>
                      <td className="py-4 px-3 text-center">
                        <button onClick={() => { setSearchTerm(client.customer_name); setView('bookings'); }} className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors">Ver reservas</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {uniqueClients.length === 0 && <p className="text-center py-12 text-gray-500">No hay clientes registrados</p>}
            </div>
          </div>
        )}

        {/* Waiting List View */}
        {view === 'waiting' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
            <h2 className="text-xl font-bold mb-4">Lista de Espera Automatizada</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Fecha Deseada</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Horario / Servicio</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {waitingList.map((item) => (
                    <tr key={item.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="py-4 px-3">
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-xs text-gray-400">{item.telefono}</p>
                      </td>
                      <td className="py-4 px-3">{new Date(item.fecha_deseada + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className="py-4 px-3">
                        <p className="text-sm">{item.horario_deseado || 'Cualquier horario'}</p>
                        <p className="text-xs text-gray-400">{item.servicio || 'General'}</p>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : item.estado === 'contactado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {item.estado.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {waitingList.length === 0 && <p className="text-center py-12 text-gray-500">La lista de espera está vacía</p>}
            </div>
          </div>
        )}

        {/* Availability Settings View */}
        {view === 'availability' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
              <h2 className="text-xl font-bold mb-4">Horarios de Atención Semanal</h2>
              <div className="space-y-4">
                {availability.map((setting) => (
                  <div key={setting.id} className={`flex items-center justify-between p-3 border rounded-xl ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-100 bg-gray-50'}`}>
                    <span className="font-medium uppercase text-sm w-24">Día {setting.day_of_week}</span>
                    <div className="text-sm">
                      {setting.is_available ? `${setting.start_time.slice(0, 5)} - ${setting.end_time.slice(0, 5)} hs` : <span className="text-red-500 font-semibold">Cerrado</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
              <h2 className="text-xl font-bold mb-4">Fechas y Días Bloqueados</h2>
              <div className="space-y-2">
                {blockedDates.map((block) => (
                  <div key={block.id} className="flex justify-between items-center text-sm p-2 border-b border-gray-700">
                    <span>{new Date(block.date + 'T12:00:00').toLocaleDateString('es-AR')}</span>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Bloqueado ({block.reason || 'Sin motivo'})</span>
                  </div>
                ))}
                {blockedDates.length === 0 && <p className="text-sm text-gray-500">No hay bloqueos específicos configurados</p>}
              </div>
            </div>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6 max-w-xl mx-auto`}>
            <h2 className="text-xl font-bold mb-4">Configuración Comercial y Pasarela</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Comercial</label>
                <input type="text" disabled value={settings?.business_name || 'Cargando...'} className="w-full px-4 py-2 rounded-xl border border-gray-700 bg-transparent outline-none opacity-60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Monto de Seña ($)</label>
                <input type="text" disabled value={`$${settings?.deposit_amount || '0.00'}`} className="w-full px-4 py-2 rounded-xl border border-gray-700 bg-transparent outline-none opacity-60 font-mono" />
              </div>
              <p className="text-xs text-gray-400 italic">Los cambios globales de configuración de la pasarela se realizan mediante variables de entorno protegidas o flujos globales de base de datos.</p>
            </div>
          </div>
        )}

        {/* WhatsApp Integration Panel */}
        {view === 'whatsapp' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6 max-w-xl mx-auto text-center`}>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Automatización de Notificaciones por WhatsApp</h2>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>El sistema despacha alertas instantáneas y recordatorios automáticos 24 horas antes de cada cita confirmada.</p>
            <div className="p-4 bg-green-50 text-green-800 rounded-xl text-xs font-mono text-left">
              API Status: ONLINE <br />
              Webhooks conectados: Confirmaciones, Cancelaciones y Lista de Espera.
            </div>
          </div>
        )}

        {/* Trash View */}
        {view === 'trash' && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-sm p-6`}>
            <h2 className="text-xl font-bold mb-4">Papelera de Reciclaje (Eliminación Automática a los 21 días)</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Cliente</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Fecha del Turno</th>
                    <th className="text-left py-4 px-3 font-medium text-gray-500">Días Restantes</th>
                    <th className="text-center py-4 px-3 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {deletedBookings.map((booking) => (
                    <tr key={booking.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="py-4 px-3 font-medium">{booking.customer_name}</td>
                      <td className="py-4 px-3">{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className="py-4 px-3 text-red-500 font-medium">{booking.deleted_at ? `${daysUntilPurge(booking.deleted_at)} días` : '-'}</td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => restoreBooking(booking.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold hover:bg-green-200 transition-colors">Restaurar</button>
                          <button onClick={() => purgeBooking(booking.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Eliminar definitivamente"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deletedBookings.length === 0 && <p className="text-center py-12 text-gray-500">La papelera está vacía</p>}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} max-w-sm w-full p-6 rounded-2xl border shadow-xl`}>
            <div className="flex items-center gap-3 text-yellow-500 mb-3">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold">¿Estás seguro?</h3>
            </div>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{confirmModal.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} className={`px-4 py-2 rounded-xl text-sm font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">Confirmar Acción</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}