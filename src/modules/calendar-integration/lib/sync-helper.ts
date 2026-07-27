import { authInvoke } from '../../../pages/admin/helpers';

export async function syncBookingToCalendar(
  bookingId: string,
  action: 'sync_booking' | 'delete' = 'sync_booking'
): Promise<boolean> {
  try {
    if (action === 'delete') {
      const { data } = await authInvoke('calendar-sync', {
        action: 'sync_booking',
        booking_id: bookingId,
      });
      return data?.success === true;
    }

    const { data } = await authInvoke('calendar-sync', {
      action: 'sync_booking',
      booking_id: bookingId,
    });
    return data?.success === true;
  } catch (e) {
    console.error('Calendar sync failed (non-blocking):', e);
    return false;
  }
}
