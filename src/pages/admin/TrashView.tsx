import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

interface TrashViewProps {
  deletedBookings: Booking[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onEmptyTrash: () => void;
  daysUntilPurge: (deletedAt: string) => number;
}

export function TrashView({
  deletedBookings,
  onRestore,
  onPurge,
  onEmptyTrash,
  daysUntilPurge,
}: TrashViewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-display">Papelera</CardTitle>
              <CardDescription>Las reservas se eliminan definitivamente a los 21 días</CardDescription>
            </div>
            {deletedBookings.length > 0 && (
              <Button onClick={onEmptyTrash} variant="destructive" size="sm">
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Vaciar papelera ({deletedBookings.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {deletedBookings.length === 0 ? (
            <div className="py-16 text-center">
              <Archive className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
              <p className="text-muted-foreground">La papelera está vacía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedBookings.map((booking) => {
                const days = daysUntilPurge(booking.deleted_at ?? booking.updated_at);
                return (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-muted/40 gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-medium truncate">{booking.customer_name}</p>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{booking.booking_code}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('es-AR')} {booking.booking_time}</span>
                        <Badge variant={days <= 3 ? 'destructive' : 'warning'} className="shrink-0">
                          Se elimina en {days} días
                        </Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4 shrink-0">
                      <Button onClick={() => onRestore(booking.id)} variant="secondary" size="sm" className="flex-1 sm:flex-none">
                        <RotateCcw className="mr-1 h-4 w-4" /> Restaurar
                      </Button>
                      <Button onClick={() => onPurge(booking.id)} variant="destructive" size="sm" className="flex-1 sm:flex-none">
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
