import { useState, useEffect } from 'react';
import { ArrowLeft, LayoutDashboard, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Booking, supabase } from '../lib/supabase';
import { setName as setSessionName, setAvatar as setSessionAvatar } from '../lib/admin-session';
import { getModuleById } from '../lib/admin-registry';
import { useBusiness } from '../contexts/BusinessContext';
import { LoginScreen } from './admin/LoginScreen';
import { ChangePasswordGate } from './admin/ChangePasswordGate';
import * as adminSession from '../lib/admin-session';
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
import { TutorialsView } from './admin/TutorialsView';
import { CalendarPage } from './admin/calendar/CalendarPage';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminHeader } from './admin/AdminHeader';
import { AdminModals } from './admin/AdminModals';
import { useAdminData } from './admin/useAdminData';
import { useSubscription, FreePlanBanner, UpgradePopup, UpgradeBanner, TrialBanner } from '../modules/subscription';
import { CalendarIntegrations } from '../modules/calendar-integration';
// import { AiAssistant } from '../modules/ai-assistant';
import type { AdminTab } from '../modules/landing/admin/lib/constants';

// Plan gratuito (prueba vencida sin renovar): solo estas secciones del panel.
const FREE_PLAN_ALLOWED_VIEWS = ['bio', 'profile', 'tutorials'];

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
    isTrial,
    enabledModules,
  } = useAdminData();

  const { loading: businessLoading, error: businessError } = useBusiness();
  const { config: subConfig } = useSubscription({ business });

  // ── Embudo de conversión ────────────────────────────────────────────────
  // El contador de días ya lo muestra DashboardView (banner naranja/violeta).
  // Acá solo se decide el popup y el banner de upgrade.
  // En prueba el popup aparece desde el día 1, una vez por sesión.
  const mostrarPopupPrueba = isTrial;
  // Prueba vencida sin contratar: el popup aparece en cada ingreso.
  const mostrarPopupFree = isFreePlan;
  // Ya contrató un plan pago: banner fijo con los planes superiores.
  // El plan completo no ve nada (UpgradeBanner devuelve null si no hay opciones).
  const mostrarBannerUpgrade = !isTrial && !isFreePlan;

  // Clave temporal: se lee una sola vez al montar; la pantalla de cambio la
  // limpia al guardar.
  const [mustChangePassword, setMustChangePassword] = useState(() => adminSession.getMustChangePassword());
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState('');
  const [supportTicket, setSupportTicket] = useState('');
  const [prevView, setPrevView] = useState<string | null>(null);
  // landingActiveTab controlado desde AdminPage y pasado tanto al sidebar como a LandingAdmin
  const [landingActiveTab, setLandingActiveTab] = useState<AdminTab | null>(null);

  // Si el plan es gratuito y la vista actual no está permitida, llevar a Bio links.
  useEffect(() => {
    if (isFreePlan && !FREE_PLAN_ALLOWED_VIEWS.includes(view)) {
      setView('bio');
    }
  }, [isFreePlan, view, setView]);

  // Acepta string para compatibilidad con DashboardView/AdminSidebar props,
  // y castea al tipo que espera setView internamente.
  const handleNavigate = (newView: string) => {
    setPrevView(view);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setView(newView as any);
  };

  const showSuccess = (msg: string) => {
    setSuccessModal({ open: true, message: msg });
  };

  const renderView = () => {
    if (!business) return null;

    // Plan gratuito: vistas no permitidas no se renderizan (el useEffect redirige a Bio).
    if (isFreePlan && !FREE_PLAN_ALLOWED_VIEWS.includes(view)) {
      return null;
    }

    switch (view) {
      case 'dashboard':
        return (
          <DashboardView
            todaysBookings={todaysBookings}
            upcomingBookings={upcomingBookings}
            paidBookings={paidBookings}
            pendingPayments={pendingPayments}
            onNavigate={handleNavigate}
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
            onUpdateStatus={(id, status) => updateBookingStatus(id, status as Booking['booking_status'])}
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
      case 'tutorials':
        return <TutorialsView />;
      case 'profile':
        return (
          <ProfileManager
            adminEmail={adminEmail}
            adminName={adminName}
            avatarUrl={adminAvatar}
            onRefresh={loadData}
            showSuccess={showSuccess}
            showLegalInfo={!isFreePlan}
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
      // 'appearance' ya no es una vista propia del menú: se muestra como
      // pestaña dentro de "Reservas de servicios". Se mantiene el case por si
      // algo navega a esa vista desde otro lado.
      case 'appearance':
      case 'services':
        return (
          <ServicesManager
            appearanceSlot={
              <AppearanceManager
                branding={branding}
                onRefresh={loadData}
                showSuccess={showSuccess}
              />
            }
          />
        );
      case 'payments':
      case 'shop':
      case 'bio':
      case 'landing': {
        const mod = getModuleById(view);
        if (!mod) return null;
        const ModuleComponent = mod.component;
        if (view === 'bio') return <ModuleComponent adminEmail={adminEmail} />;
        // CAMBIO CLAVE: se pasa activeTab y setActiveTab a LandingAdmin
        if (view === 'landing') return (
          <ModuleComponent
            business={business}
            activeTab={landingActiveTab}
            setActiveTab={setLandingActiveTab}
          />
        );
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

  // Clave temporal de la invitacion: no se entra al panel sin cambiarla.
  if (mustChangePassword) {
    return (
      <ChangePasswordGate
        onDone={() => setMustChangePassword(false)}
        onLogout={handleLogout}
      />
    );
  }

  // Si el login funcionó pero el negocio nunca pudo cargarse (error de red,
  // negocio inexistente, o una sesión vieja sin negocio asociado), antes esto
  // dejaba el panel girando en "Cargando..." para siempre sin ninguna salida.
  if (!businessLoading && !business) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-sm text-destructive font-medium mb-2">No se pudo cargar tu negocio</p>
          <p className="text-sm text-muted-foreground mb-6">{businessError || 'Tu sesión puede haber vencido. Volvé a iniciar sesión.'}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading || businessLoading) {
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
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
        // CAMBIO CLAVE: conectar estado de tab con el sidebar
        landingActiveTab={landingActiveTab}
        setLandingActiveTab={(tab) => {
          setLandingActiveTab(landingActiveTab === tab ? null : tab);
          handleNavigate('landing');
        }}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden pb-16 lg:pb-0">
        {/* Barra fina del período de prueba: va arriba del header y queda fija
            porque el scroll ocurre dentro de <main>, no en esta columna. */}
        {isTrial && <TrialBanner trialCountdown={trialCountdown} />}
        {/* Misma posicion y altura que la barra de prueba: cuando el negocio ya
            tiene un plan pago, en ese lugar va la invitacion a subir. */}
        {mostrarBannerUpgrade && <UpgradeBanner enabledModules={enabledModules} />}

        <AdminHeader
          title={currentViewTitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          adminName={adminName}
          adminAvatar={adminAvatar}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {isFreePlan && <FreePlanBanner supportUrl={subConfig.payment_button_url} />}
          {renderView()}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border bg-card/95 backdrop-blur-md px-6 py-2.5">
          <button
            onClick={() => {
              if (prevView) { handleNavigate(prevView); }
              else { handleNavigate(isFreePlan ? 'bio' : 'dashboard'); }
            }}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[10px] font-bold">Atrás</span>
          </button>

          <span className="text-xs text-gray-500 font-bold">by BioWebLink</span>

          <button
            onClick={() => handleNavigate(isFreePlan ? 'bio' : 'dashboard')}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
        </nav>
      </div>

      {/* Popup de planes: del día 5 de prueba (1 vez por sesión) y siempre en free */}
      {(mostrarPopupPrueba || mostrarPopupFree) && (
        <UpgradePopup
          enabledModules={enabledModules}
          isFreePlan={isFreePlan}
          isTrial={isTrial}
          alwaysShow={mostrarPopupFree}
        />
      )}

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
                Powered by <span className="font-bold">BioWebLink</span>
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

      {/* <AiAssistant /> */}

    </div>
  );
}