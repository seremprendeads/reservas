import { Clock, CalendarDays, Phone, Eye } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

interface DashboardViewProps {
  trialCountdown: { days: number; hours: number; minutes: number; seconds: number };
  todaysBookings: Booking[];
  upcomingBookings: Booking[];
  paidBookings: Booking[];
  pendingPayments: Booking[];
  onNavigate: (view: string) => void;
  onSelectBooking: (booking: Booking) => void;
}

export function DashboardView({
  trialCountdown,
  todaysBookings,
  upcomingBookings,
  paidBookings,
  pendingPayments,
  onNavigate,
  onSelectBooking,
}: DashboardViewProps) {
  const { days, hours, minutes, seconds } = trialCountdown;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Trial banner */}
      {(() => {
        if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) return null;

        const isUrgent = days <= 2;
        const totalTrialMs = 14 * 24 * 60 * 60 * 1000;
        const remainingMs = days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
        const progress = Math.max(0, Math.min(100, ((totalTrialMs - remainingMs) / totalTrialMs) * 100));

        const pad = (n: number) => String(n).padStart(2, '0');

        return (
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-purple-600 to-violet-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzRtMC00djItSDJ2MmgzNG0wLTR2MkgydjJoMzRtMC00djJIMnYyaDM0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative p-4 sm:p-6 md:p-8">
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/90">
                      Período de prueba
                    </p>
                    <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1">
                      {isUrgent ? '¡Quedan pocos días!' : 'Disfrutá todas las funcionalidades'}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      {[
                        { val: days, label: 'D' },
                        { val: hours, label: 'H' },
                        { val: minutes, label: 'M' },
                        { val: seconds, label: 'S' },
                      ].map(({ val, label }) => (
                        <div key={label} className="flex flex-col items-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-red-600 text-white text-lg sm:text-xl md:text-2xl font-bold tabular-nums shadow-lg shadow-red-900/30">
                            {pad(val)}
                          </span>
                          <span className="text-[8px] sm:text-[10px] font-medium text-white/60 mt-1 sm:mt-1.5 uppercase tracking-wider">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <a
                  href="#prices"
                  target="_blank"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 sm:px-8 py-3 text-sm font-bold uppercase tracking-wider text-white bg-red-600 border border-red-500 shadow-lg hover:bg-red-700 transition-all duration-200 hover:shadow-xl active:scale-[0.97]"
                >
                  Actualizar Plan
                </a>
              </div>
              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-[11px] font-medium text-white/50 uppercase tracking-wider">Progreso del trial</span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/70">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 sm:h-2 w-full rounded-full overflow-hidden bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-white/80 to-white/50 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
