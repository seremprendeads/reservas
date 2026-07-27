import { ArrowLeft, Phone, Mail } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { getPaymentBadge } from './helpers';
import { NotasAdmin } from './NotasAdmin';

interface BookingDetailViewProps {
  selectedBooking: Booking;
  onBack: () => void;
  onUpdateStatus: (id: string, status: Booking['booking_status']) => void;
  onDelete: (id: string) => void;
  onSaved: () => void;
}

export function BookingDetailView({
  selectedBooking,
  onBack,
  onUpdateStatus,
  onDelete,
  onSaved,
}: BookingDetailViewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Button onClick={onBack} variant="ghost" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Detalle de reserva</CardTitle>
            <span className="font-mono text-sm text-muted-foreground">{selectedBooking.booking_code}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <p className="text-2xl font-display">{selectedBooking.customer_name}</p>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />{selectedBooking.customer_phone}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />{selectedBooking.customer_email}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/40 p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Fecha</p>
                <p className="font-medium mt-2 text-base">{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Hora</p>
                <p className="font-medium mt-2 text-base">{selectedBooking.booking_time} hs</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2.5 text-sm text-muted-foreground">Estado del pago</p>
              <Badge variant={getPaymentBadge(selectedBooking.payment_status).variant}>
                {getPaymentBadge(selectedBooking.payment_status).label}
              </Badge>
            </div>
            <div>
              <p className="mb-2.5 text-sm text-muted-foreground">Monto</p>
              <p className="text-3xl font-display">${selectedBooking.amount.toLocaleString('es-AR')} ARS</p>
            </div>
          </div>

          <Separator />

          <NotasAdmin
            booking={selectedBooking}
            onSaved={onSaved}
          />

          <div className="flex gap-3 pt-4">
            {selectedBooking.booking_status === 'pending' && (
              <Button onClick={() => onUpdateStatus(selectedBooking.id, 'confirmed')} className="flex-1">
                Confirmar
              </Button>
            )}
            {selectedBooking.booking_status === 'confirmed' && (
              <Button onClick={() => onUpdateStatus(selectedBooking.id, 'completed')} variant="secondary" className="flex-1">
                Completar
              </Button>
            )}
            {(selectedBooking.booking_status === 'pending' || selectedBooking.booking_status === 'confirmed') && (
              <Button onClick={() => onUpdateStatus(selectedBooking.id, 'cancelled')} variant="destructive" className="flex-1">
                Cancelar
              </Button>
            )}
            {(selectedBooking.booking_status === 'cancelled' || selectedBooking.booking_status === 'completed') && (
              <Button onClick={() => onDelete(selectedBooking.id)} variant="destructive" className="flex-1">
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
