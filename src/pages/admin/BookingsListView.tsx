import { Search, RefreshCw, Phone, Mail, Eye, Calendar, Clock, XCircle, Trash2 } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { getStatusBadge, getPaymentBadge } from './helpers';

interface BookingsListViewProps {
  filteredBookings: Booking[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  onRefresh: () => void;
  onSelectBooking: (booking: Booking) => void;
  onUpdateStatus: (id: string, status: Booking['booking_status']) => void;
  onDelete: (id: string) => void;
}

export function BookingsListView({
  filteredBookings,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onSelectBooking,
  onUpdateStatus,
  onDelete,
}: BookingsListViewProps) {
  return (
    <Card className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60 transition-all duration-200">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre, teléfono, email o código..." value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)} className="h-12 pl-9 rounded-xl transition-all duration-200" />
          </div>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}
            className="flex h-12 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200">
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          <Button onClick={onRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                <th className="hidden px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Contacto</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hora</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pago</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/40 transition-all duration-200">
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{booking.booking_code}</td>
                  <td className="px-4 py-4 font-medium">{booking.customer_name}</td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{booking.customer_phone}</div>
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{booking.customer_email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-4 text-sm">{booking.booking_time}</td>
                  <td className="px-4 py-4">
                    <Badge variant={getPaymentBadge(booking.payment_status).variant}>
                      {getPaymentBadge(booking.payment_status).label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={getStatusBadge(booking.booking_status).variant}>
                      {getStatusBadge(booking.booking_status).label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button onClick={() => onSelectBooking(booking)}
                        variant="ghost" size="icon" title="Ver detalle">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {booking.booking_status === 'pending' && (
                        <Button onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                          variant="ghost" size="icon" title="Confirmar" className="text-emerald-600">
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                      {booking.booking_status === 'confirmed' && (
                        <Button onClick={() => onUpdateStatus(booking.id, 'completed')}
                          variant="ghost" size="icon" title="Completar" className="text-blue-600">
                          <Clock className="h-4 w-4" />
                        </Button>
                      )}
                      {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') && (
                        <Button onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                          variant="ghost" size="icon" title="Cancelar" className="text-destructive">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(booking.booking_status === 'cancelled' || booking.booking_status === 'completed') && (
                        <Button onClick={() => onDelete(booking.id)}
                          variant="ghost" size="sm" className="text-destructive" title="Eliminar">
                          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-3 h-14 w-14 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No se encontraron reservas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
