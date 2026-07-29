import { useState, useEffect } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAdminAuth } from './useAdminAuth';
import { useAdminBookings } from './useAdminBookings';
import { useAdminNav } from './useAdminNav';
import { useModuleAccess } from '../../modules/subscription';
import type { View, NavItem } from './types';

export type { View, NavItem };

export function useAdminData() {
  const { business } = useBusiness();
  const { enabledModules, isFreePlan } = useModuleAccess();
  const [view, setView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const auth = useAdminAuth();
  const bookings = useAdminBookings({
    businessId: business?.id,
    onProfileLoaded: (name, avatar) => {
      if (name) auth.setAdminName(name);
      if (avatar) auth.setAdminAvatar(avatar);
    },
    setConfirmModal,
  });
  const nav = useAdminNav(bookings.waitingList, bookings.deletedBookings, enabledModules);

  const currentViewTitle = nav.viewTitles[view];

  useEffect(() => {
    if (auth.loggedIn && business?.id) bookings.loadData();
  }, [auth.loggedIn, business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    business,
    loggedIn: auth.loggedIn,
    adminEmail: auth.adminEmail,
    adminName: auth.adminName,
    setAdminName: auth.setAdminName,
    adminAvatar: auth.adminAvatar,
    setAdminAvatar: auth.setAdminAvatar,
    view,
    setView,
    bookings: bookings.bookings,
    availability: bookings.availability,
    blockedDates: bookings.blockedDates,
    branding: bookings.branding,
    loading: bookings.loading,
    searchTerm: bookings.searchTerm,
    setSearchTerm: bookings.setSearchTerm,
    statusFilter: bookings.statusFilter,
    setStatusFilter: bookings.setStatusFilter,
    selectedBooking: bookings.selectedBooking,
    setSelectedBooking: bookings.setSelectedBooking,
    deletedBookings: bookings.deletedBookings,
    waitingList: bookings.waitingList,
    confirmModal,
    setConfirmModal,
    successModal,
    setSuccessModal,
    sidebarOpen,
    setSidebarOpen,
    trialWarningOpen: auth.trialWarningOpen,
    setTrialWarningOpen: auth.setTrialWarningOpen,
    trialDaysLeft: auth.trialDaysLeft,
    trialCountdown: auth.trialCountdown,
    darkMode: auth.darkMode,
    setDarkMode: auth.setDarkMode,
    loadData: bookings.loadData,
    handleLogin: auth.handleLogin,
    handleLogout: auth.handleLogout,
    updateBookingStatus: bookings.updateBookingStatus,
    deleteBooking: bookings.deleteBooking,
    restoreBooking: bookings.restoreBooking,
    purgeBooking: bookings.purgeBooking,
    emptyTrash: bookings.emptyTrash,
    daysUntilPurge: bookings.daysUntilPurge,
    filteredBookings: bookings.filteredBookings,
    todaysBookings: bookings.todaysBookings,
    upcomingBookings: bookings.upcomingBookings,
    paidBookings: bookings.paidBookings,
    pendingPayments: bookings.pendingPayments,
    navItems: nav.navItems,
    currentViewTitle,
    isFreePlan,
    enabledModules,
  };
}
