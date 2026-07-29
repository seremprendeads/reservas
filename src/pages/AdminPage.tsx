import { useState } from 'react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Booking } from '../lib/supabase';
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

  if (subscription.is_blocked) {
    return (
      <SuspendedScreen
        message={subConfig.suspended_message}
        supportWhatsapp={subConfig.support_whatsapp}
        supportEmail={subConfig.support_email}
      />
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

      <a
        href="mailto:support@bookingbio.com"
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 hidden lg:flex"
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
      </a>

    </div>
  );
}
