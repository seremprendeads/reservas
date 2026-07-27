import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { authInvoke } from './helpers';

export function NotasAdmin({
  booking, onSaved
}: {
  booking: Booking;
  onSaved: () => void;
}) {
  const [nota, setNota] = useState(booking.notas_admin || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  const saveNota = async () => {
    setSaving(true);
    try {
      const { data, error } = await authInvoke('admin-update-booking', {
        booking_id: booking.id,
        notas_admin: nota,
      });
      if (error || !data?.success) throw new Error('Error al guardar');
      setSaved(true);
      onSaved();
    } catch {
      alert('Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          📝 Notas internas
          <span className="text-xs font-normal text-muted-foreground">(solo visible para el admin)</span>
        </label>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="h-3 w-3" /> Guardado
          </span>
        )}
      </div>
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        rows={3}
        placeholder="Ej: cliente puntual / siempre llega tarde / requiere preparación especial..."
        className="flex w-full min-h-[48px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
      />
      <Button onClick={saveNota} disabled={saving} variant="secondary" size="sm">
        {saving ? 'Guardando...' : 'Guardar nota'}
      </Button>
    </div>
  );
}
