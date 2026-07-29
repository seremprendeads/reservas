import { useState, useMemo } from 'react';
import { supabase, Booking, AvailabilitySetting, BlockedDate, Branding, WaitingListItem } from '../../lib/supabase';
import { authInvoke } from './helpers';
import { syncBookingToCalendar } from '../../modules/calendar-integration';
import * as session from '../../lib/admin-session';

interface UseAdminBookingsOpts {
  businessId: string | undefined;
  onProfileLoaded: (name: string | null, avatar: string | null) => void;
  setConfirmModal: (modal: { open: boolean; message: string; onConfirm: () => void }) => void;
}

export function useAdminBookings({ businessId, onProfileLoaded, setConfirmModal }: UseAdminBookingsOpts) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [deletedBookings, setDeletedBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [bookingsRes, availRes, blockedRes, , brandingRes, profileRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('business_id', businessId).order('booking_date', { ascending: true }),
        supabase.from('availability_settings').select('*').eq('business_id', businessId).order('day_of_week'),
        supabase.from('blocked_dates').select('*').eq('business_id', businessId).order('date'),
        supabase.from('settings').select('*').eq('business_id', businessId).maybeSingle(),
        supabase.from('branding').select('*').eq('business_id', businessId).maybeSingle(),
        authInvoke('get-admin-profile'),
      ]);

      if (profileRes.data?.profile) {
        const profile = profileRes.data.profile;
        if (profile.name) session.setName(profile.name);
        if (profile.avatar_url) session.setAvatar(profile.avatar_url);
        onProfileLoaded(profile.name ?? null, profile.avatar_url ?? null);
      }

      if (bookingsRes.data) {
        const active = bookingsRes.data.filter((b) => !b.deleted_at);
        const deleted = bookingsRes.data.filter((b) => !!b.deleted_at);
        setBookings(active);
        setDeletedBookings(deleted);
        setSelectedBooking(prev => {
          if (!prev) return null;
          return active.find((b) => b.id === prev.id) || prev;
        });
      }
      if (availRes.data) setAvailability(availRes.data);
      if (blockedRes.data) setBlockedDates(blockedRes.data);
      if (brandingRes.data) setBranding(brandingRes.data);

      const { data: wlData } = await authInvoke('admin-get-waiting-list', {});
      if (wlData?.success) setWaitingList(wlData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: loadData is called from the orchestrator (useAdminData) gated on loggedIn + businessId

  const updateBookingStatus = async (id: string, status: Booking['booking_status']) => {
    try {
      const { data, error } = await authInvoke('admin-update-booking', { booking_id: id, booking_status: status });
      if (error || !data?.success) throw new Error('Error al actualizar');
      syncBookingToCalendar(id).catch(() => {});
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
        setConfirmModal({ open: false, message: '', onConfirm: () => {} });
        try {
          const { data, error } = await authInvoke('admin-delete-booking', { booking_id: id });
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
      const { data, error } = await authInvoke('admin-restore-booking', { booking_id: id });
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
        setConfirmModal({ open: false, message: '', onConfirm: () => {} });
        try {
          const { data, error } = await authInvoke('admin-purge-bookings', { booking_id: id });
          if (error || !data?.success) throw new Error('Error al eliminar');
          loadData();
        } catch {
          alert('Error al eliminar definitivamente');
        }
      },
    });
  };

  const emptyTrash = async () => {
    setConfirmModal({
      open: true,
      message: '¿Vaciar papelera? Todas las reservas se eliminarán definitivamente.',
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: () => {} });
        try {
          const { data, error } = await authInvoke('admin-purge-bookings', { purge_all: true });
          if (error || !data?.success) throw new Error('Error al vaciar papelera');
          loadData();
        } catch {
          alert('Error al vaciar la papelera');
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

  const filteredBookings = useMemo(() => bookings.filter((b) => {
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer_phone.includes(searchTerm) ||
      b.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.booking_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [bookings, searchTerm, statusFilter]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  const todaysBookings = useMemo(() => bookings.filter((b) => b.booking_date === todayStr), [bookings, todayStr]);
  const upcomingBookings = useMemo(() => bookings.filter((b) => b.booking_date > todayStr), [bookings, todayStr]);
  const paidBookings = useMemo(() => bookings.filter((b) => b.payment_status === 'approved'), [bookings]);
  const pendingPayments = useMemo(() => bookings.filter((b) => b.payment_status === 'pending'), [bookings]);

  return {
    bookings,
    deletedBookings,
    availability,
    blockedDates,
    branding,
    waitingList,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedBooking,
    setSelectedBooking,
    loadData,
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
  };
}
