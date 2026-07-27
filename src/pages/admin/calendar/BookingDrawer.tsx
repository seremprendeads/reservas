import { X, Phone, Mail, Clock, Calendar, CreditCard, FileText, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import type { Booking } from '../../../lib/supabase';
import { STATUS_COLORS, STATUS_LABELS } from './types';
import { formatDateDisplay } from './calendarUtils';

interface BookingDrawerProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function BookingDrawer({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
}: BookingDrawerProps) {
  if (!isOpen || !booking) return null;

  const colors = STATUS_COLORS[booking.booking_status] || STATUS_COLORS.pending;
  const time = booking.booking_time.substring(0, 5);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-lg font-display font-semibold text-foreground">Detalle de Reserva</h3>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`rounded-lg px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}>
                  {STATUS_LABELS[booking.booking_status] || booking.booking_status}
                </span>
                {booking.payment_status === 'approved' && (
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Pagado
                  </span>
                )}
              </div>
              <h4 className="text-xl font-bold text-foreground">{booking.customer_name}</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium text-foreground">{booking.customer_phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{booking.customer_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium text-foreground">{formatDateDisplay(booking.booking_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="text-sm font-medium text-foreground">{time} hs</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Método de pago</p>
                  <p className="text-sm font-medium text-foreground">
                    {booking.payment_status === 'approved' ? 'MercadoPago' : booking.payment_status === 'pending' ? 'Pendiente' : 'Rechazado'}
                    {booking.amount > 0 && ` - $${booking.amount.toLocaleString('es-AR')}`}
                  </p>
                </div>
              </div>

              {booking.notas_admin && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm text-foreground">{booking.notas_admin}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Código de reserva</p>
                  <p className="text-sm font-medium text-foreground font-mono">{booking.booking_code}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-6 py-4 space-y-2">
            {booking.booking_status !== 'confirmed' && (
              <button
                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar
              </button>
            )}

            {booking.booking_status !== 'completed' && booking.booking_status !== 'cancelled' && (
              <button
                onClick={() => onUpdateStatus(booking.id, 'completed')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Marcar Completada
              </button>
            )}

            {booking.booking_status !== 'cancelled' && (
              <button
                onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            )}

            <button
              onClick={() => { onDelete(booking.id); onClose(); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
