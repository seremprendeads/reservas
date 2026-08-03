import { useState } from 'react';
import { ArrowLeft, LayoutDashboard, Mail, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Booking, supabase } from '../lib/supabase';
import { setName as setSessionName, setAvatar as setSessionAvatar } from '../lib/admin-session';
import { getModuleById } from '../lib/admin-registry';
import { LoginScreen } from './admin/LoginScreen';
import { AvailabilityManager } from './admin/AvailabilityManager';
import { ClientsManager } from './admin/ClientsManager';
import { WhatsAppManager } from './admin/WhatsAppManager';
import { WaitingListManager } from './admin/WaitingListManager';
import { ProfileManager } from './admin/ProfileManager';
import { AppearanceManager } from './admin/AppearanceManager';
import { ServicesManager } from './admin/ServicesManager';
import { DashboardView } from './admin/DashboardView';
import { BookingsListView } from './admin/BookingsListView';
import { BookingDetailView } from './admin/BookingDetailView';
import { TrashView } from './admin/TrashView';
import { CalendarPage } from './admin/calendar/CalendarPage';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { AdminModals } from './admin/AdminModals';
import { useAdminData } from './admin/useAdminData';
import { useSubscription, FreePlanBanner } from '../modules/subscription';
import { SuspendedScreen } from '../modules/subscription';
import { CalendarIntegrations } from '../modules/calendar-integration';
import { AiAssistant } from '../modules/ai-assistant';

export function AdminPage() {
  const {
    business,
    loggedIn,
    adminEmail,
    adminName,
    setAdminName,
    adminAvatar,
    setAdminAvatar,
    view,
    setView,
    bookings,
    availability,
    blockedDates,
    branding,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedBooking,
    setSelectedBooking,
    deletedBookings,
    waitingList,
    confirmModal,
    setConfirmModal,
    successModal,
    setSuccessModal,
    sidebarOpen,
    setSidebarOpen,
    trialWarningOpen,
    setTrialWarningOpen,
    trialDaysLeft,
    trialCountdown,
    darkMode,
    setDarkMode,
    loadData,
    handleLogin,
    handleLogout,
    updateBookingStatus,
    deleteBooking,
    restoreBooking,
    purgeBooking,
    emptyTrash,
    daysUntilPurge,
    filteredBookings,
    todaysBookings,
    upcomingBookings,
    paidBookings,
    pendingPayments,
    navItems,
    currentViewTitle,
    isFreePlan,
  } = useAdminData();

  const { subscription, config: subConfig } = useSubscription({ business });

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const [prevView, setPrevView] = useState<string | null>(null);
  const handleNavigate = (newView: string) => {
    setPrevView(view);
    setView(newView);
  };

  const showSuccess = (msg: string) => {
    setSuccessModal({ open: true, message: msg });
  };

  const renderView = () => {
    if (!business) return null;

    const isSuspended = subscription.status === 'suspended';
    const suspendedAllowedViews = ['dashboard', 'bio', 'profile', 'integrations', 'calendar'];
    if (isSuspended && !suspendedAllowedViews.includes(view)) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-md rounded-2xl bg-red-50 p-8 border border-red-200 shadow-sm">
            <h3 className="text-lg font-bold text-red-800 mb-2">Módulo bloqueado por suspensión</h3>
            <p className="text-sm text-red-600 mb-6">
              Tu período de prueba de 14 días ha finalizado. Durante la suspensión, solo tenés acceso al Módulo Bio en modo gratuito. Activá un plan para desbloquear reservas, tienda y landing.
            </p>
            <button
              onClick={() => handleNavigate('profile')}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow hover:bg-red-700"
            >
              ACTUALIZAR PLAN
            </button>
          </div>
        </div>
      );
    }

    const freePlanAllowedViews = ['dashboard', 'bio', 'profile', 'calendar', 'integrations'];
    if (isFreePlan && !freePlanAllowedViews.includes(view)) {
      return <DashboardView
        trialCountdown={trialCountdown}
        todaysBookings={todaysBookings}
        upcomingBookings={upcomingBookings}
        paidBookings={paidBookings}
        pendingPayments={pendingPayments}
        onNavigate={(newView: string) => handleNavigate(newView)}
        onSelectBooking={(booking: Booking) => {
          setSelectedBooking(booking);
          handleNavigate('detail');
        }}
      />;
    }

    switch (view) {
      case 'dashboard':
        return (
          <DashboardView
            trialCountdown={trialCountdown}
            todaysBookings={todaysBookings}
            upcomingBookings={upcomingBookings}
            paidBookings={paidBookings}
            pendingPayments={pendingPayments}
            onNavigate={(newView: string) => handleNavigate(newView)}
            onSelectBooking={(booking: Booking) => {
              setSelectedBooking(booking);
              handleNavigate('detail');
            }}
          />
        );
      case 'bookings':
        return (
          <BookingsListView
            filteredBookings={filteredBookings}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={loadData}
            onSelectBooking={(booking: Booking) => {
              setSelectedBooking(booking);
              handleNavigate('detail');
            }}
            onUpdateStatus={updateBookingStatus}
            onDelete={deleteBooking}
          />
        );
      case 'detail':
        return selectedBooking ? (
          <BookingDetailView
            selectedBooking={selectedBooking}
            onBack={() => handleNavigate('bookings')}
            onUpdateStatus={updateBookingStatus}
            onDelete={deleteBooking}
            onSaved={() => {
              loadData();
            }}
          />
        ) : null;
      case 'calendar':
        return (
          <CalendarPage
            bookings={bookings}
            availability={availability}
            blockedDates={blockedDates}
            onRefresh={loadData}
            onUpdateStatus={updateBookingStatus}
            onDelete={deleteBooking}
          />
        );
      case 'integrations':
        return <CalendarIntegrations />;
      case 'availability':
        return (
          <AvailabilityManager
            availability={availability}
            blockedDates={blockedDates}
            onRefresh={loadData}
            showSuccess={showSuccess}
          />
        );
      case 'clients':
        return (
          <ClientsManager
            bookings={bookings}
            onRefresh={loadData}
            setConfirmModal={setConfirmModal}
            showSuccess={showSuccess}
          />
        );
      case 'waiting':
        return <WaitingListManager waitingList={waitingList} onRefresh={loadData} />;
      case 'whatsapp':
        return <WhatsAppManager bookings={bookings} />;
      case 'profile':
        return (
          <ProfileManager
            adminEmail={adminEmail}
            adminName={adminName}
            avatarUrl={adminAvatar}
            onRefresh={loadData}
            showSuccess={showSuccess}
            onProfileUpdated={(name: string, _email: string) => {
              setAdminName(name);
              setSessionName(name);
            }}
            onAvatarChange={(url: string) => {
              setAdminAvatar(url);
              setSessionAvatar(url);
            }}
          />
        );
      case 'appearance':
        return (
          <AppearanceManager
            branding={branding}
            onRefresh={loadData}
            showSuccess={showSuccess}
          />
        );
      case 'services':
        return <ServicesManager />;
      case 'payments':
      case 'shop':
      case 'bio':
      case 'landing': {
        const mod = getModuleById(view);
        if (!mod) return null;
        const ModuleComponent = mod.component;
        if (view === 'bio') return <ModuleComponent adminEmail={adminEmail} />;
        if (view === 'landing') return <ModuleComponent business={business} />;
        return <ModuleComponent />;
      }
      case 'trash':
        return (
          <TrashView
            deletedBookings={deletedBookings}
            onRestore={restoreBooking}
            onPurge={purgeBooking}
            onEmptyTrash={emptyTrash}
            daysUntilPurge={daysUntilPurge}
          />
        );
      default:
        return null;
    }
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-gray-900 flex">
        <AdminSidebar
          navItems={navItems}
          currentView={view}
          onNavigate={(newView: string) => {
            handleNavigate(newView);
            setSidebarOpen(false);
          }}
        sidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        adminName={adminName}
        adminAvatar={adminAvatar}
        adminEmail={adminEmail}
        businessName={business?.name || ''}
        businessSlug={business?.slug || ''}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden pb-16 lg:pb-0">
        {subscription.status === 'suspended' && (
          <div className="bg-red-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-3 shadow-md z-40">
            <span>🔴 [ESTADO: SUSPENDIDO / TRIAL VENCIDO] El período de prueba de 14 días ha finalizado. Acceso restringido al Módulo Bio Gratuito.</span>
            <button
              onClick={() => handleNavigate('profile')}
              className="bg-white text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow"
            >
              ACTUALIZAR PLAN
            </button>
          </div>
        )}
        <AdminHeader
          title={currentViewTitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          adminName={adminName}
          adminAvatar={adminAvatar}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          businessSlug={business?.slug}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {isFreePlan && <FreePlanBanner supportUrl={subConfig.payment_button_url} />}
          {renderView()}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-card/95 backdrop-blur-md px-6 py-2.5">
          <button
            onClick={() => {
              if (prevView) { handleNavigate(prevView); }
              else { handleNavigate('dashboard'); }
            }}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[10px] font-bold">Atrás</span>
          </button>

          <span className="text-xs text-gray-500 font-bold">by bookingBio</span>

          <button
            onClick={() => handleNavigate('dashboard')}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
        </nav>
      </div>

      <AdminModals
        confirmModal={confirmModal}
        onSuccessClose={() => setSuccessModal({ open: false, message: '' })}
        onConfirmClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        successModal={successModal}
        trialWarningOpen={trialWarningOpen}
        onTrialWarningClose={() => setTrialWarningOpen(false)}
        trialDaysLeft={trialDaysLeft}
        trialCountdown={trialCountdown}
      />

      <button
        onClick={() => setSupportOpen(true)}
        className="group fixed bottom-6 right-6 z-50 hidden items-center gap-2 lg:flex"
        title="Soporte"
      >
        <span className="hidden rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-all duration-200 group-hover:block dark:bg-gray-100 dark:text-gray-900">
          🤔 Soporte
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:shadow-primary/40">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </span>
      </button>

        <Dialog open={supportOpen} onOpenChange={(open) => { setSupportOpen(open); if (!open) { setSupportSent(false); setSupportTicket(''); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          {supportSent ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <Mail className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              {supportTicket && (
                <p className="text-center text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Ticket #{supportTicket}
                </p>
              )}
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                Gracias por comunicarte,<br />en breve estaremos revisando la duda o el problema.
              </p>
              <p className="text-center text-xs font-semibold text-foreground">
                El equipo de soporte
              </p>
              <button
                onClick={() => { setSupportOpen(false); setSupportSent(false); setSupportTicket(''); }}
                className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90"
              >
                Cerrar
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                Powered by <span className="font-bold">Bookingbio</span>
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-display">Contactar soporte</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSupportSending(true);
                  setSupportError('');
                  const form = e.currentTarget;
                  const name = (form.nombre as HTMLInputElement).value;
                  const phone = (form.telefono as HTMLInputElement).value;
                  const msg = (form.mensaje as HTMLTextAreaElement).value;
                  const { data, error: fnError } = await supabase.functions.invoke('send-support-email', {
                    body: { name, phone, message: msg },
                  });
                  setSupportSending(false);
                  if (fnError) {
                    const msg = (fnError as Record<string, string>).error || fnError.message || 'Error al enviar. Intentalo de nuevo.';
                    setSupportError(msg);
                    return;
                  }
                  setSupportTicket((data as Record<string, string>)?.ticket || '');
                  setSupportSent(true);
                }}
                className="flex flex-col gap-4 pt-2"
              >
                <input
                  name="nombre"
                  placeholder="Tu nombre"
                  required
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <input
                  name="telefono"
                  type="tel"
                  placeholder="Tu celular"
                  required
                  className="h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <textarea
                  name="mensaje"
                  placeholder="Escribí tu mensaje..."
                  rows={4}
                  required
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
                {supportError && (
                  <p className="text-center text-xs text-red-500">{supportError}</p>
                )}
                <button
                  type="submit"
                  disabled={supportSending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  {supportSending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AiAssistant />

    </div>
  );
}
