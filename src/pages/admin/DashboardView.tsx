import { CalendarDays, Phone, Eye, ExternalLink } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useBusiness } from '../../contexts/BusinessContext';

interface DashboardViewProps {
  todaysBookings: Booking[];
  upcomingBookings: Booking[];
  paidBookings: Booking[];
  pendingPayments: Booking[];
  onNavigate: (view: string) => void;
  onSelectBooking: (booking: Booking) => void;
}

export function DashboardView({
  todaysBookings,
  upcomingBookings,
  paidBookings,
  pendingPayments,
  onNavigate,
  onSelectBooking,
}: DashboardViewProps) {
  const { business } = useBusiness();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-10">

      {/* Header con link a la web pública de reservas (mismo patrón que en
          "Reservas de servicios"), no navegación interna. */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-tight">Principal</h1>
        <a href={`/${business?.slug || '...'}/reservas`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver reservas
          </Button>
        </a>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99] cursor-pointer group"
          onClick={() => onNavigate('bookings')}>
          <CardContent className="p-8">
            <p className="text-4xl font-display tracking-tight text-foreground">{todaysBookings.length}</p>
            <p className="text-base text-muted-foreground mt-3">Reservas hoy</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99] cursor-pointer group"
          onClick={() => onNavigate('bookings')}>
          <CardContent className="p-8">
            <p className="text-4xl font-display tracking-tight text-foreground">{upcomingBookings.length}</p>
            <p className="text-base text-muted-foreground mt-3">Reservas futuras</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99] cursor-pointer group"
          onClick={() => onNavigate('bookings')}>
          <CardContent className="p-8">
            <p className="text-4xl font-display tracking-tight text-foreground">{paidBookings.length}</p>
            <p className="text-base text-muted-foreground mt-3">Reservas pagadas</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-premium-hover active:scale-[0.99] cursor-pointer group"
          onClick={() => onNavigate('bookings')}>
          <CardContent className="p-8">
            <p className="text-4xl font-display tracking-tight text-foreground">{pendingPayments.length}</p>
            <p className="text-base text-muted-foreground mt-3">Pagos pendientes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reservas de hoy</CardTitle>
          <CardDescription className="text-base">
            {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todaysBookings.length > 0 ? (
            <div className="space-y-3">
              {todaysBookings.map((booking) => (
                <div key={booking.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:shadow-premium cursor-pointer"
                  onClick={() => onSelectBooking(booking)}>
                  <div className="flex items-center gap-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <span className="font-display text-lg font-medium text-primary">{booking.booking_time.slice(0, 5)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-base">{booking.customer_name}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3.5 w-3.5" />{booking.customer_phone}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <CalendarDays className="mx-auto mb-4 h-16 w-16 text-muted-foreground/15" />
              <p className="text-lg text-muted-foreground">No hay reservas para hoy</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Próximas reservas</CardTitle>
          <CardDescription className="text-base">Las próximas 5 reservas agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div key={booking.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:shadow-premium cursor-pointer"
                  onClick={() => onSelectBooking(booking)}>
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[56px]">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                      </p>
                      <p className="font-display text-2xl mt-0.5">{new Date(booking.booking_date + 'T12:00:00').getDate()}</p>
                    </div>
                    <div>
                      <p className="font-medium text-base">{booking.customer_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{booking.booking_time} hs</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <CalendarDays className="mx-auto mb-4 h-16 w-16 text-muted-foreground/15" />
              <p className="text-lg text-muted-foreground">No hay reservas futuras</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
