import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
  Plus,
  XCircle,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { supabase, Booking, AvailabilitySetting, BlockedDate, Settings } from '../lib/supabase';

type View = 'dashboard' | 'bookings' | 'availability' | 'settings' | 'detail' | 'edit';

export function AdminPage() {
  const [view, setView] = useState<View>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, availRes, blockedRes, settingsRes] = await Promise.all([
        supabase.from('bookings').select('*').order('booking_date', { ascending: true }),
        supabase.from('availability_settings').select('*').order('day_of_week'),
        supabase.from('blocked_dates').select('*').order('date'),
        supabase.from('settings').select('*').maybeSingle(),
      ]);

      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (availRes.data) setAvailability(availRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['booking_status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error al actualizar la reserva');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Panel de Administracion</h1>
                <p className="text-sm text-gray-500">CRM de Reservas</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Pagina de Reservas</span>
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setView('dashboard')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              view === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('bookings')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              view === 'bookings'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Reservas
          </button>
          <button
            onClick={() => setView('availability')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              view === 'availability'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-5 h-5" />
            Disponibilidad
          </button>
          <button
            onClick={() => setView('settings')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              view === 'settings'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Configuracion
          </button>
        </div>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">Hoy</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{todaysBookings.length}</p>
                <p className="text-gray-600">Reservas hoy</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-500">Proximas</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{upcomingBookings.length}</p>
                <p className="text-gray-600">Reservas futuras</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">Pagadas</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{paidBookings.length}</p>
                <p className="text-gray-600">Reservas pagadas</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-500">Pendientes</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{pendingPayments.length}</p>
                <p className="text-gray-600">Pagos pendientes</p>
              </div>
            </div>

            {/* Today's Bookings */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reservas de hoy</h2>
              {todaysBookings.length > 0 ? (
                <div className="space-y-3">
                  {todaysBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <span className="text-emerald-600 font-bold">
                            {booking.booking_time.slice(0, 5)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-lg">{booking.customer_name}</p>
                          <p className="text-gray-500 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {booking.customer_phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.booking_status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.booking_status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.booking_status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.booking_status === 'confirmed'
                            ? 'Confirmada'
                            : booking.booking_status === 'completed'
                            ? 'Completada'
                            : booking.booking_status === 'cancelled'
                            ? 'Cancelada'
                            : 'Pendiente'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setView('detail');
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay reservas para hoy</p>
              )}
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Proximas reservas</h2>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            {new Date(booking.booking_date).toLocaleDateString('es-AR', {
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xl font-bold text-gray-800">
                            {new Date(booking.booking_date).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{booking.customer_name}</p>
                          <p className="text-gray-500 text-sm">{booking.booking_time} hs</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setView('detail');
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay reservas futuras</p>
              )}
            </div>
          </div>
        )}

        {/* Bookings View */}
        {view === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, telefono, email o codigo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl text-lg focus:border-emerald-500 outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Codigo</th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Cliente</th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium hidden md:table-cell">
                      Contacto
                    </th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Fecha</th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Hora</th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Pago</th>
                    <th className="text-left py-4 px-3 text-gray-600 font-medium">Estado</th>
                    <th className="text-center py-4 px-3 text-gray-600 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-3">
                        <button
                          onClick={() => copyCode(booking.booking_code)}
                          className="flex items-center gap-1 font-mono text-emerald-600 hover:text-emerald-700"
                        >
                          {booking.booking_code}
                          <Copy className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="py-4 px-3">
                        <p className="font-medium text-gray-800">{booking.customer_name}</p>
                      </td>
                      <td className="py-4 px-3 hidden md:table-cell">
                        <p className="text-gray-600 text-sm">{booking.customer_phone}</p>
                        <p className="text-gray-500 text-sm">{booking.customer_email}</p>
                      </td>
                      <td className="py-4 px-3 text-gray-700">
                        {new Date(booking.booking_date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-4 px-3 text-gray-700">{booking.booking_time}</td>
                      <td className="py-4 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.payment_status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : booking.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.payment_status === 'approved'
                            ? 'Aprobado'
                            : booking.payment_status === 'pending'
                            ? 'Pendiente'
                            : 'Rechazado'}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.booking_status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.booking_status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : booking.booking_status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.booking_status === 'confirmed'
                            ? 'Confirmada'
                            : booking.booking_status === 'completed'
                            ? 'Completada'
                            : booking.booking_status === 'cancelled'
                            ? 'Cancelada'
                            : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setView('detail');
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {booking.booking_status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                              title="Marcar completada"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                          {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
                            <button
                              onClick={() => {
                                if (confirm('¿Estas seguro de cancelar esta reserva?')) {
                                  updateBookingStatus(booking.id, 'cancelled');
                                }
                              }}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                              title="Cancelar reserva"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBookings.length === 0 && (
                <p className="text-center text-gray-500 py-12">
                  No se encontraron reservas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Detail View */}
        {view === 'detail' && selectedBooking && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setView('bookings')}
              className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Reserva {selectedBooking.booking_code}
                  </h2>
                  <p className="text-gray-500">
                    Creada el{' '}
                    {new Date(selectedBooking.created_at).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedBooking.booking_status === 'confirmed' && (
                    <button
                      onClick={() => {
                        updateBookingStatus(selectedBooking.id, 'completed');
                        setSelectedBooking({ ...selectedBooking, booking_status: 'completed' });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Completar
                    </button>
                  )}
                  {selectedBooking.booking_status !== 'cancelled' &&
                    selectedBooking.booking_status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Estas seguro de cancelar esta reserva?')) {
                            updateBookingStatus(selectedBooking.id, 'cancelled');
                            setSelectedBooking({ ...selectedBooking, booking_status: 'cancelled' });
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Cancelar
                      </button>
                    )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente</p>
                    <p className="text-lg font-medium text-gray-800">
                      {selectedBooking.customer_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5" />
                    <span>{selectedBooking.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-5 h-5" />
                    <span>{selectedBooking.customer_email}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4">
                    <Calendar className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha</p>
                      <p className="text-lg font-medium text-gray-800">
                        {new Date(selectedBooking.booking_date).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 rounded-xl p-4">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="text-lg font-medium text-gray-800">
                        {selectedBooking.booking_time} hs
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-6" />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado del pago</p>
                  <span
                    className={`px-3 py-2 rounded-lg font-medium ${
                      selectedBooking.payment_status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : selectedBooking.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {selectedBooking.payment_status === 'approved'
                      ? 'Pagado'
                      : selectedBooking.payment_status === 'pending'
                      ? 'Pendiente'
                      : 'Rechazado'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monto</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${selectedBooking.amount.toLocaleString('es-AR')} ARS
                  </p>
                </div>
              </div>

              {selectedBooking.payment_id && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">ID de Pago</p>
                  <p className="font-mono text-gray-700">{selectedBooking.payment_id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability View */}
        {view === 'availability' && (
          <div className="space-y-6">
            <AvailabilityManager
              availability={availability}
              blockedDates={blockedDates}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && settings && (
          <SettingsManager settings={settings} onRefresh={loadData} />
        )}
      </div>
    </div>
  );
}

function AvailabilityManager({
  availability,
  blockedDates,
  onRefresh,
}: {
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  onRefresh: () => void;
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
      const { error } = await supabase
        .from('availability_settings')
        .update({
          start_time: startTime,
          end_time: endTime,
          is_active: isActive,
        })
        .eq('day_of_week', editingDay);

      if (error) throw error;
      setEditingDay(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error al guardar');
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;

    try {
      const { error } = await supabase.from('blocked_dates').insert({
        date: newBlockedDate,
        reason: newBlockedReason || null,
      });

      if (error) throw error;
      setNewBlockedDate('');
      setNewBlockedReason('');
      onRefresh();
    } catch (error) {
      console.error('Error adding blocked date:', error);
      alert('Error al agregar fecha bloqueada');
    }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error removing blocked date:', error);
      alert('Error al eliminar fecha bloqueada');
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Working Days */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Dias laborables</h2>
        <div className="space-y-3">
          {availability.map((day) => (
            <div key={day.id} className="p-4 bg-gray-50 rounded-xl">
              {editingDay === day.day_of_week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{DAYS[day.day_of_week]}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Activo</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="px-3 py-2 border rounded-lg"
                    />
                    <span>a</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveDay}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingDay(null)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        day.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <span className="font-medium text-gray-800">
                        {DAYS[day.day_of_week]}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {day.start_time.slice(0, 5)} - {day.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => startEditing(day)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Fechas bloqueadas</h2>

        <div className="space-y-3 mb-6">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
          />
          <input
            type="text"
            value={newBlockedReason}
            onChange={(e) => setNewBlockedReason(e.target.value)}
            placeholder="Razon (opcional)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
          />
          <button
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar fecha bloqueada
          </button>
        </div>

        <div className="space-y-2">
          {blockedDates.map((blocked) => (
            <div
              key={blocked.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {new Date(blocked.date).toLocaleDateString('es-AR', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {blocked.reason && (
                  <p className="text-sm text-gray-500">{blocked.reason}</p>
                )}
              </div>
              <button
                onClick={() => removeBlockedDate(blocked.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          ))}
          {blockedDates.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay fechas bloqueadas</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsManager({ settings, onRefresh }: { settings: Settings; onRefresh: () => void }) {
  const [price, setPrice] = useState(settings.price.toString());
  const [currency, setCurrency] = useState(settings.currency);
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({
          price: parseFloat(price) || 0,
          currency,
        })
        .eq('id', settings.id);

      if (error) throw error;
      onRefresh();
      alert('Configuracion guardada');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Configuracion general</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de la reserva
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl text-gray-500">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 px-4 py-3 text-xl border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 outline-none"
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dolar Americano</option>
              <option value="MXN">MXN - Peso Mexicano</option>
            </select>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
        </div>
      </div>
    </div>
  );
}
