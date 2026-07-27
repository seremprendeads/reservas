import { useState } from 'react';
import { Search, Phone, MessageSquare } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const DEFAULT_TEMPLATE = 'Hola {nombre} Tu reserva fue aprobada. Te esperamos el día {fecha} a las {hora}. Muy pronto la recepcionista a cargo se contactará contigo para darte información más detallada de la orden de llegada en estos días hábiles. ¡Muchas Gracias! Saludos.';

export function WhatsAppManager({ bookings }: { bookings: Booking[] }) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState(DEFAULT_TEMPLATE);
  const [search, setSearch] = useState('');

  const pendingBookings = bookings.filter(b =>
    b.booking_status === 'pending' || b.booking_status === 'confirmed'
  );

  const filtered = pendingBookings.filter(b =>
    b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_phone.includes(search)
  );

  const buildMessage = (booking: Booking) => {
    const fecha = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const hora = booking.booking_time.slice(0, 5);
    return message
      .replace('{nombre}', booking.customer_name)
      .replace('{fecha}', fecha)
      .replace('{hora}', hora);
  };

  const sendWhatsApp = (booking: Booking) => {
    const phone = booking.customer_phone.replace(/\D/g, '');
    const text = encodeURIComponent(buildMessage(booking));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_8px_30px_rgba(0,0,0,.05)]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
              Plan Pro
            </span>
            <div>
              <p className="text-lg font-bold">Automatizá mensajes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Con el Plan Pro el cliente recibe la confirmación por WhatsApp{' '}
                <span className="font-semibold text-foreground">AUTOMÁTICAMENTE AL PAGAR</span>
                {' '}sin intervención manual,{' '}
                <span className="font-semibold text-foreground">24 hs, 7 días, feriados incluidos.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
        <CardHeader>
          <CardTitle className="font-display">Plantilla del mensaje</CardTitle>
          <CardDescription>Personalizá el mensaje que se enviará por WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-all duration-200" />
          <p className="text-xs text-muted-foreground">
            Variables: <code className="rounded bg-muted px-1 py-0.5">{'{nombre}'}</code>{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{fecha}'}</code>{' '}
            <code className="rounded bg-muted px-1 py-0.5">{'{hora}'}</code>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
        <CardHeader>
          <CardTitle className="font-display">Seleccionar reserva</CardTitle>
          <CardDescription>Elegí una reserva para enviar el mensaje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl pl-9" />
          </div>
          <div className="space-y-3">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No hay reservas disponibles</p>}
            {filtered.map((booking) => (
              <div key={booking.id}
                className={cn(
                  'rounded-xl border border-border/60 p-4 transition-all duration-200 cursor-pointer',
                  selectedBooking?.id === booking.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/40'
                )}
                onClick={() => setSelectedBooking(booking === selectedBooking ? null : booking)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate">{booking.customer_name}</p>
                      <Badge variant={booking.booking_status === 'confirmed' ? 'success' : 'warning'}>
                        {booking.booking_status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Phone className="mr-1 inline h-3 w-3" />
                      {booking.customer_phone} — {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} {booking.booking_time.slice(0, 5)} hs
                    </p>
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); sendWhatsApp(booking); }} size="sm" className="shrink-0">
                    <MessageSquare className="mr-1 h-4 w-4" /> Enviar
                  </Button>
                </div>
                {selectedBooking?.id === booking.id && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-1 text-xs font-medium text-primary">Vista previa:</p>
                    <p className="rounded-xl border border-border/60 bg-card p-3 text-sm">{buildMessage(booking)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
