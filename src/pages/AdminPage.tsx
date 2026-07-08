import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  UserCircle,
  Menu,
  X,
} from 'lucide-react';
import { supabase, Booking, AvailabilitySetting, BlockedDate, Settings } from '../lib/supabase';

type View = 'dashboard' | 'bookings' | 'availability' | 'settings' | 'detail' | 'trash' | 'whatsapp' | 'clients' | 'waiting' | 'profile';

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
  const [adminName, setAdminName] = useState(sessionStorage.getItem('admin_name') || '');
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
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('admin_dark') === '1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin_dark', darkMode ? '1' : '0');
  }, [darkMode]);

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

      // Cargar lista de espera
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.booking_date > todayStr);
  const paidBookings = bookings.filter((b) => b.payment_status === 'approved');
  const pendingPayments = bookings.filter((b) => b.payment_status === 'pending');

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-dm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Administración</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CRM de Reservas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" className="flex items-center gap-2 px-4 py-2 text-gray-300 transition-colors rounded-lg hover:text-emerald-600 hover:bg-emerald-50">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Pagina de Reservas</span>
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
        {(() => {
          const tabs = [
            { id: 'dashboard' as View, label: 'Principal', icon: null as React.ReactNode },
            { id: 'bookings' as View, label: 'Reservas', icon: <Users className="w-5 h-5" /> },
            { id: 'clients' as View, label: 'Clientes', icon: <FileText className="w-5 h-5" /> },
            { id: 'waiting' as View, label: `Lista de espera${waitingList.filter(w => w.estado === 'pendiente').length > 0 ? ` (${waitingList.filter(w => w.estado === 'pendiente').length})` : ''}`, icon: <ClipboardList className="w-5 h-5" /> },
            { id: 'availability' as View, label: 'Disponibilidad', icon: <Clock className="w-5 h-5" /> },
            { id: 'settings' as View, label: 'Configuracion', icon: <DollarSign className="w-5 h-5" /> },
            { id: 'profile' as View, label: 'Perfil', icon: <UserCircle className="w-5 h-5" /> },
            { id: 'whatsapp' as View, label: 'WhatsApp', icon: <MessageSquare className="w-5 h-5" /> },
            { id: 'trash' as View, label: `${deletedBookings.length > 0 ? ` (${deletedBookings.length})` : ''}`, icon: <Trash2 className="w-5 h-5" /> },
          ];
          const currentTab = tabs.find(t => t.id === view);
          return (
            <>
              {/* Mobile hamburger menu */}
              <div className="mb-6 sm:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-dm font-medium shadow-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}`}>
                  <span className="flex items-center gap-2">
                    {currentTab?.icon}
                    {currentTab?.label}
                  </span>
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                {mobileMenuOpen && (
                  <div className={`mt-2 space-y-1 rounded-xl shadow-sm p-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {tabs.map(tab => (
                      <button key={tab.id} onClick={() => { setView(tab.id); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg text-dm font-medium transition-all ${view === tab.id ? 'bg-emerald-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {tab.icon}{tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Desktop horizontal nav */}
              <div className="hidden sm:flex flex-wrap justify-center gap-2 mb-6 text-center">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setView(tab.id)}
                   className={`px-4 py-2 rounded-lg text-dm font-medium transition-all flex items-center gap-2 ${view === tab.id ? 'bg-emerald-600 text-white shadow-lg' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>
            </>
          );
        })()}

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Reservas hoy', value: todaysBookings.length, color: 'blue', icon: <Calendar className="w-6 h-6 text-blue-600" /> },
                { label: 'Reservas futuras', value: upcomingBookings.length, color: 'emerald', icon: <Users className="w-6 h-6 text-emerald-600" /> },
                { label: 'Reservas pagadas', value: paidBookings.length, color: 'green', icon: <DollarSign className="w-6 h-6 text-green-600" /> },
                { label: 'Pagos pendientes', value: pendingPayments.length, color: 'yellow', icon: <AlertCircle className="w-6 h-6 text-yellow-600" /> },
              ].map((stat) => (
                <button key={stat.label} onClick={() => setView('bookings')}
                  className={`w-full text-left ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6 cursor-pointer transition-transform active:scale-[0.98] hover:shadow-md`}>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>{stat.icon}</div>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stat.value}</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{stat.label}</p>
                </button>
              ))}
            </div>
            <div className={`${darkMode ? 'bg-gray-200' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-800' : 'text-gray-800'}`}>Reservas de hoy</h2>
              {todaysBookings.length > 0 ? (
                <div className="space-y-3">
                  {todaysBookings.map((booking) => (
                    <div key={booking.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl">
                          <span className="font-bold text-emerald-600">{booking.booking_time.slice(0, 5)}</span>
                        </div>
                        <div>
                          <p className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{booking.customer_name}</p>
                          <p className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><Phone className="w-4 h-4" />{booking.customer_phone}</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}>
                        <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay reservas para hoy</p>}
            </div>
            <div className={`${darkMode ? 'bg-gray-100' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-800' : 'text-gray-800'}`}>Proximas reservas</h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}</p>
                          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{new Date(booking.booking_date + 'T12:00:00').getDate()}</p>
                        </div>
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{booking.customer_name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{booking.booking_time} hs</p>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}>
                        <Eye className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay reservas futuras</p>}
            </div>
          </div>
        )}

        {/* Bookings */}
        {view === 'bookings' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
            <div className="flex flex-col gap-4 mb-6 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                <input type="text" placeholder="Buscar por nombre, telefono, email o codigo..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl text-lg focus:border-emerald-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-3 border rounded-xl text-lg focus:border-emerald-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
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
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Codigo</th>
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cliente</th>
                    <th className={`text-left py-4 px-3 font-medium hidden md:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contacto</th>
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fecha</th>
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hora</th>
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pago</th>
                    <th className={`text-left py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Estado</th>
                    <th className={`text-center py-4 px-3 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`py-4 px-3 font-mono text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{booking.booking_code}</td>
                      <td className={`py-4 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{booking.customer_name}</td>
                      <td className="hidden px-3 py-4 md:table-cell">
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer_phone}</div>
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customer_email}</div>
                        </div>
                      </td>
                      <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                      <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{booking.booking_time}</td>
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
                          <button onClick={() => { setSelectedBooking(booking); setView('detail'); }} className={`p-2 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`} title="Ver detalle"><Eye className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} /></button>
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
              {filteredBookings.length === 0 && <p className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No se encontraron reservas</p>}
            </div>
          </div>
        )}

        {/* Detail */}
        {view === 'detail' && selectedBooking && (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setView('bookings')} className="flex items-center gap-2 mb-6 text-gray-300 hover:text-emerald-600">
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <div className="p-8 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Detalle de reserva</h2>
                <span className="font-mono text-gray-500">{selectedBooking.booking_code}</span>
              </div>
              <div className="grid gap-6 mb-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-lg font-bold text-gray-800">{selectedBooking.customer_name}</p>
                  <div className="flex items-center gap-2 text-gray-700"><Phone className="w-5 h-5" />{selectedBooking.customer_phone}</div>
                  <div className="flex items-center gap-2 text-gray-700"><Mail className="w-5 h-5" />{selectedBooking.customer_email}</div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium text-gray-800">{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <p className="text-sm text-gray-500">Hora</p>
                    <p className="font-medium text-gray-800">{selectedBooking.booking_time} hs</p>
                  </div>
                </div>
              </div>
              <hr className="my-6" />
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-sm text-gray-500">Estado del pago</p>
                  <span className={`px-3 py-2 rounded-lg font-medium ${selectedBooking.payment_status === 'approved' ? 'bg-green-100 text-green-700' : selectedBooking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedBooking.payment_status === 'approved' ? 'Pagado' : selectedBooking.payment_status === 'pending' ? 'Pendiente' : 'Rechazado'}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-sm text-gray-500">Monto</p>
                  <p className="text-2xl font-bold text-gray-800">${selectedBooking.amount.toLocaleString('es-AR')} ARS</p>
                </div>
              </div>

              {/* Notas internas del admin */}
              <hr className="my-6" />
              <NotasAdmin
                booking={selectedBooking}
                adminEmail={adminEmail}
                adminPassword={adminPassword}
                onSaved={() => loadData()}
              />

              <div className="flex gap-3 mt-8">
                {selectedBooking.booking_status === 'pending' && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'confirmed'); setView('bookings'); }} className="flex-1 py-3 font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700">Confirmar</button>
                )}
                {selectedBooking.booking_status === 'confirmed' && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'completed'); setView('bookings'); }} className="flex-1 py-3 font-semibold text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200">Completar</button>
                )}
                {(selectedBooking.booking_status === 'pending' || selectedBooking.booking_status === 'confirmed') && (
                  <button onClick={() => { updateBookingStatus(selectedBooking.id, 'cancelled'); setView('bookings'); }} className="flex-1 py-3 font-semibold text-red-700 bg-red-100 rounded-xl hover:bg-red-200">Cancelar</button>
                )}
                {(selectedBooking.booking_status === 'cancelled' || selectedBooking.booking_status === 'completed') && (
                  <button onClick={() => { deleteBooking(selectedBooking.id); setView('bookings'); }} className="flex-1 py-3 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700">Eliminar</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Availability */}
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

        {/* Settings */}
        {view === 'settings' && settings && (
          <SettingsManager
            settings={settings}
            onRefresh={loadData}
            adminEmail={adminEmail}
            adminPassword={adminPassword}
            showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
          />
        )}

        {/* Waiting List */}
        {view === 'waiting' && (
          <WaitingListManager
            waitingList={waitingList}
            onRefresh={loadData}
            adminEmail={adminEmail}
            adminPassword={adminPassword}
            darkMode={darkMode}
          />
        )}

        {/* Clients */}
        {view === 'clients' && (
          <ClientsManager bookings={bookings} darkMode={darkMode} />
        )}

        {/* WhatsApp */}
        {view === 'whatsapp' && (
          <WhatsAppManager bookings={bookings} darkMode={darkMode} />
        )}

        {/* Profile */}
        {view === 'profile' && (
          <ProfileManager
            adminEmail={adminEmail}
            adminPassword={adminPassword}
            adminName={adminName}
            darkMode={darkMode}
            onRefresh={loadData}
            showSuccess={(msg) => setSuccessModal({ open: true, message: msg })}
            onProfileUpdated={(name, email, password) => {
              setAdminName(name);
              setAdminEmail(email);
              setAdminPassword(password);
            }}
          />
        )}

        {/* Trash */}
        {view === 'trash' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Papelera</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Las reservas se eliminan definitivamente a los 21 días</p>
              </div>
            </div>
            {deletedBookings.length === 0 ? (
              <div className="py-16 text-center">
                <Trash2 className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>La papelera está vacía</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deletedBookings.map((booking) => {
                  const days = daysUntilPurge((booking as any).deleted_at);
                  return (
                    <div key={booking.id} className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{booking.customer_name}</p>
                          <span className="font-mono text-xs text-gray-400">{booking.booking_code}</span>
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-3`}>
                          <span>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} {booking.booking_time}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${days <= 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            Se elimina en {days} días
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => restoreBooking(booking.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          title="Restaurar"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restaurar
                        </button>
                        <button
                          onClick={() => purgeBooking(booking.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
                          title="Eliminar definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {successModal.open && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[9999] px-4">
          <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
            <div className="flex items-center justify-center mx-auto mb-4 bg-green-100 rounded-full w-14 h-14">
              <CheckCircle className="text-green-600 w-7 h-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-center text-gray-800">¡Listo!</h3>
            <p className="mb-8 text-center text-gray-500">{successModal.message}</p>
            <button
              onClick={() => setSuccessModal({ open: false, message: '' })}
              className="w-full py-3 font-semibold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700"
            >
              Aceptar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
      {confirmModal.open && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[9999] px-4">
          <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
            <div className="flex items-center justify-center mx-auto mb-4 bg-red-100 rounded-full w-14 h-14">
              <Trash2 className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-center text-gray-800">Eliminar reserva</h3>
            <p className="mb-8 text-center text-gray-500">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className="flex-1 py-3 font-semibold text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 font-semibold text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
      <div className="p-6 bg-gray-800 shadow-sm rounded-2xl">
        <h2 className="mb-6 text-xl font-bold text-gray-300">Dias laborables</h2>
        <div className="space-y-3">
          {availability.map((day) => (
            <div key={day.id} className="p-4 bg-gray-50 rounded-xl">
              {editingDay === day.day_of_week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{DAYS[day.day_of_week]}</span>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-5 h-5 border-gray-300 rounded text-emerald-600" />
                      <span>Activo</span>
                    </label>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 w-12 flex-shrink-0">Desde</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                    </div>
                    <span className="hidden sm:inline flex-shrink-0 self-center">a</span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 w-12 flex-shrink-0">Hasta</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveDay} className="flex-1 py-2 text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">Guardar</button>
                    <button onClick={() => setEditingDay(null)} className="flex-1 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full ${day.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-gray-800 whitespace-nowrap">{DAYS[day.day_of_week]}</span>
                    <span className="text-gray-600 truncate">{day.start_time.slice(0, 5)} - {day.end_time.slice(0, 5)}</span>
                  </div>
                  <button onClick={() => startEditing(day)} className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-200">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-800 shadow-sm rounded-2xl">
        <h2 className="mb-6 text-xl font-bold text-gray-300">Fechas bloqueadas</h2>
        <div className="mb-6 space-y-3">
          <input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
          <input type="text" value={newBlockedReason} onChange={(e) => setNewBlockedReason(e.target.value)} placeholder="Razon (opcional)" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
          <button onClick={addBlockedDate} disabled={!newBlockedDate} className="w-full py-3 font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">Agregar fecha bloqueada</button>
        </div>
        <div className="space-y-2">
          {blockedDates.map((blocked) => (
            <div key={blocked.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">{new Date(blocked.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                {blocked.reason && <p className="text-sm text-gray-500">{blocked.reason}</p>}
              </div>
              <button onClick={() => removeBlockedDate(blocked.id)} className="p-2 rounded-lg hover:bg-red-100">
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
          {blockedDates.length === 0 && <p className="py-4 text-center text-gray-500">No hay fechas bloqueadas</p>}
        </div>
      </div>
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
    <div className="max-w-xl mx-auto">
      <div className="p-6 bg-white shadow-sm rounded-2xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">Configuracion general</h2>
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Precio de la reserva</label>
            <div className="flex items-center gap-2">
              <span className="text-xl text-gray-500">$</span>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="flex-1 px-4 py-3 text-xl border border-gray-200 outline-none rounded-xl focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3 border border-gray-200 outline-none rounded-xl focus:border-emerald-500">
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dolar Americano</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
          </div>
          <button onClick={saveSettings} disabled={saving} className="w-full py-4 text-lg font-semibold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
        </div>
      </div>
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

function ClientsManager({ bookings, darkMode }: { bookings: Booking[]; darkMode: boolean }) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Agrupar reservas por email (cliente único)
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

  // Filtros
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

    // Headers
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
    <div className={`rounded-2xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Clientes</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{clients.length} clientes encontrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-xl hover:bg-red-200">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
          <input type="text" placeholder="Buscar por nombre o teléfono..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl text-base focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className={`px-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className={`px-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {['Nombre', 'WhatsApp', 'Email', 'Primera reserva', 'Última reserva', 'Total'].map(h => (
                <th key={h} className={`text-left py-4 px-3 font-medium text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
            {clients.map((c, i) => (
              <tr key={i} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                <td className={`py-4 px-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.name}</td>
                <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>
                </td>
                <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</div>
                </td>
                <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(c.firstBooking)}</td>
                <td className={`py-4 px-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(c.lastBooking)}</td>
                <td className="px-3 py-4">
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">{c.totalBookings}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No se encontraron clientes</p>
        )}
      </div>
    </div>
  );
}

// ─── WhatsApp Manager ─────────────────────────────────────────────────────────
function WhatsAppManager({ bookings, darkMode }: { bookings: Booking[]; darkMode: boolean }) {
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
    <div className={`rounded-2xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="mb-6">
        <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Enviar mensaje de aprobación</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Seleccioná una reserva y enviá el mensaje por WhatsApp</p>
      </div>
      <div className="mb-6">
        <div className="relative p-6 mb-5 overflow-hidden shadow-lg rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600">
          <div className="absolute top-0 right-0 w-32 h-32 translate-x-8 -translate-y-8 bg-white rounded-full opacity-5" />
          <div className="absolute bottom-0 left-0 w-24 h-24 -translate-x-6 translate-y-6 bg-white rounded-full opacity-5" />
        <div className="relative flex flex-col items-center gap-4 text-center">

  <span className="px-3 py-1 text-sm font-bold tracking-wide text-yellow-900 uppercase bg-yellow-400 rounded-full">
    Plan Pro
  </span>

  <div className="flex-1">
    <p className="mb-2 text-base font-bold text-white">
      Automatizá mensajes
    </p>

    <p className="text-sm leading-relaxed text-purple-100">
      Con el Plan Pro el cliente recibe la confirmación por WhatsApp{" "}
      <span className="font-semibold text-white">
        <br />
        AUTOMÁTICAMENTE AL PAGAR
      </span>
      <br />
      sin intervención manual,{" "}
      <span className="font-semibold text-white">
        24 hs, 7 días, feriados incluidos.
      </span>
    </p>
  </div>

</div>
        </div>
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Plantilla del mensaje</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          className={`w-full px-4 py-3 border rounded-xl text-base resize-none focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-200 border-gray-600 text-gray-800 placeholder-gray-400' : 'border-gray-200'}`} />
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Variables: <code className="px-1 bg-gray-100 rounded">{'{nombre}'}</code> <code className="px-1 bg-gray-100 rounded">{'{fecha}'}</code> <code className="px-1 bg-gray-100 rounded">{'{hora}'}</code>
        </p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
        <input type="text" placeholder="Buscar por nombre o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 border rounded-xl text-base focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No hay reservas disponibles</p>}
        {filtered.map((booking) => (
          <div key={booking.id} className={`rounded-xl p-4 border ${selectedBooking?.id === booking.id ? 'border-emerald-500 bg-emerald-50' : darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedBooking(booking === selectedBooking ? null : booking)}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className={`font-medium truncate ${darkMode && selectedBooking?.id !== booking.id ? 'text-white' : 'text-gray-800'}`}>{booking.customer_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {booking.booking_status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
                <div className={`text-sm flex flex-wrap items-center gap-2 ${darkMode && selectedBooking?.id !== booking.id ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="flex items-center gap-1"><Phone className="flex-shrink-0 w-3 h-3" />{booking.customer_phone}</span>
                  <span>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} — {booking.booking_time.slice(0, 5)} hs</span>
                </div>
              </div>
              <button onClick={() => sendWhatsApp(booking)}
                className="flex items-center justify-center flex-shrink-0 w-full gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-500 rounded-xl hover:bg-green-600 sm:w-auto">
                <MessageSquare className="w-4 h-4" /> Enviar
              </button>
            </div>
            {selectedBooking?.id === booking.id && (
              <div className="pt-3 mt-3 border-t border-emerald-200">
                <p className="mb-1 text-xs font-medium text-emerald-600">Vista previa:</p>
                <p className="p-3 text-sm text-gray-700 bg-white border rounded-lg border-emerald-200">{buildMessage(booking)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WaitingList Manager ──────────────────────────────────────────────────────
function WaitingListManager({
  waitingList, onRefresh, adminEmail, adminPassword, darkMode
}: {
  waitingList: WaitingListItem[];
  onRefresh: () => void;
  adminEmail: string;
  adminPassword: string;
  darkMode: boolean;
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

  const estadoColors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    contactado: 'bg-blue-100 text-blue-700',
    convertido: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
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
    <div className={`rounded-2xl shadow-sm p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Lista de espera</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {waitingList.filter(w => w.estado === 'pendiente').length} pendientes de {waitingList.length} total
          </p>
        </div>
        <button onClick={onRefresh} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
          <RefreshCw className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
          <input type="text" placeholder="Buscar por nombre, teléfono o email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl text-base focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
        </div>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          className={`px-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}>
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="contactado">Contactado</option>
          <option value="convertido">Convertido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardList className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No hay registros en la lista de espera</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className={`rounded-xl p-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.nombre}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColors[item.estado]}`}>
                      {estadoLabel[item.estado]}
                    </span>
                  </div>
                  <div className={`text-sm flex flex-wrap gap-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.telefono}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{item.email}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.fecha_deseada)}</span>
                    {item.horario_deseado && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.horario_deseado.slice(0, 5)} hs</span>}
                    {item.servicio && <span>• {item.servicio}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.estado === 'pendiente' && (
                    <button onClick={() => updateItem(item.id, 'contactado')} disabled={saving === item.id}
                      className="px-3 py-2 text-sm font-medium text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50">
                      Contactar
                    </button>
                  )}
                  {(item.estado === 'pendiente' || item.estado === 'contactado') && (
                    <button onClick={() => updateItem(item.id, 'convertido')} disabled={saving === item.id}
                      className="px-3 py-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded-lg hover:bg-green-200 disabled:opacity-50">
                      Convertido
                    </button>
                  )}
                  {item.estado !== 'cancelado' && item.estado !== 'convertido' && (
                    <button onClick={() => updateItem(item.id, 'cancelado')} disabled={saving === item.id}
                      className="px-3 py-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50">
                      Cancelar
                    </button>
                  )}
                  <button onClick={() => updateItem(item.id, undefined, 'delete')} disabled={saving === item.id}
                    className="p-2 transition-colors rounded-lg hover:bg-red-100 disabled:opacity-50">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Profile Manager ───────────────────────────────────────────────────────────
function ProfileManager({
  adminEmail, adminPassword, adminName, darkMode, onRefresh, showSuccess, onProfileUpdated
}: {
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  darkMode: boolean;
  onRefresh: () => void;
  showSuccess: (msg: string) => void;
  onProfileUpdated: (name: string, email: string, password: string) => void;
}) {
  const [name, setName] = useState(adminName);
  const [email, setEmail] = useState(adminEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    <div className="max-w-xl mx-auto">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm p-6`}>
        <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mi Perfil</h2>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 border border-red-200 bg-red-50 rounded-xl">
            <XCircle className="flex-shrink-0 w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 rounded-xl focus:border-emerald-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
          </div>
          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 text-base border-2 rounded-xl focus:border-emerald-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`} />
          </div>

          <hr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Dejá los campos en blanco si no querés cambiar la contraseña.
          </p>

          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nueva contraseña</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-12 text-base border-2 rounded-xl focus:border-emerald-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-gray-600 transition-colors">
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirmar nueva contraseña</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-12 text-base border-2 rounded-xl focus:border-emerald-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200'}`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute text-gray-400 -translate-y-1/2 right-4 top-1/2 hover:text-gray-600 transition-colors">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 text-lg font-semibold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notas internas del admin ─────────────────────────────────────────────────
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
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          📝 Notas internas
          <span className="text-xs font-normal text-gray-400">(solo visible para el admin)</span>
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="w-3 h-3" /> Guardado
          </span>
        )}
      </div>
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        rows={3}
        placeholder="Ej: cliente puntual / siempre llega tarde / requiere preparación especial..."
        className="w-full px-4 py-3 text-sm text-gray-700 transition-colors border-2 border-gray-200 resize-none rounded-xl focus:outline-none focus:border-emerald-500"
      />
      <button
        onClick={saveNota}
        disabled={saving}
        className="px-4 py-2 mt-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar nota'}
      </button>
    </div>
  );
}