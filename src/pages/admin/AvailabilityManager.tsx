import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { AvailabilitySetting, BlockedDate } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { authInvoke } from './helpers';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AvailabilityManager({
  availability, blockedDates, onRefresh, showSuccess
}: {
  availability: AvailabilitySetting[];
  blockedDates: BlockedDate[];
  onRefresh: () => void;
  showSuccess: (msg: string) => void;
}) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  const startEditing = (day: AvailabilitySetting) => {
    setEditingDay(day.day_of_week);
    setStartTime(day.start_time);
    setEndTime(day.end_time);
    setIsActive(day.is_active);
  };

  const saveDay = async () => {
    if (editingDay === null) return;
    try {
      const { data, error } = await authInvoke('admin-update-availability', {
        day_of_week: editingDay, start_time: startTime, end_time: endTime, is_active: isActive,
      });
      if (error || !data?.success) throw new Error('Error al guardar');
      setEditingDay(null);
      onRefresh();
      showSuccess('Horario actualizado correctamente');
    } catch {
      alert('Error al guardar');
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;
    try {
      const { data, error } = await authInvoke('admin-manage-blocked-dates', {
        action: 'add', date: newBlockedDate, reason: newBlockedReason || null,
      });
      if (error || !data?.success) throw new Error('Error al agregar');
      setNewBlockedDate('');
      setNewBlockedReason('');
      onRefresh();
      showSuccess('Fecha bloqueada agregada');
    } catch { alert('Error al agregar fecha'); }
  };

  const removeBlockedDate = async (id: string) => {
    try {
      const { data, error } = await authInvoke('admin-manage-blocked-dates', {
        action: 'remove', id,
      });
      if (error || !data?.success) throw new Error('Error al eliminar');
      onRefresh();
    } catch { alert('Error al eliminar fecha'); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
        <CardHeader>
          <CardTitle className="font-display">Días laborables</CardTitle>
          <CardDescription>Configurá los horarios de atención por día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availability.map((day) => (
            <div key={day.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-muted/40">
              {editingDay === day.day_of_week ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{DAYS[day.day_of_week]}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      Activo
                    </label>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-12 flex-shrink-0 text-sm text-muted-foreground">Desde</span>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 h-12 rounded-xl" />
                    </div>
                    <span className="hidden self-center sm:inline text-muted-foreground">a</span>
                    <div className="flex items-center gap-2">
                      <span className="w-12 flex-shrink-0 text-sm text-muted-foreground">Hasta</span>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={saveDay} size="sm" className="flex-1 transition-all duration-200">Guardar</Button>
                    <Button onClick={() => setEditingDay(null)} variant="secondary" size="sm" className="flex-1 transition-all duration-200">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${day.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{DAYS[day.day_of_week]}</span>
                    <span className="text-sm text-muted-foreground">{day.start_time.slice(0, 5)} — {day.end_time.slice(0, 5)}</span>
                  </div>
                  <Button onClick={() => startEditing(day)} variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)]">
        <CardHeader>
          <CardTitle className="font-display">Fechas bloqueadas</CardTitle>
          <CardDescription>Días sin atención (feriados, vacaciones, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-3">
            <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} className="h-12 rounded-xl" />
            <Input type="text" value={newBlockedReason} onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="Razón (opcional)" className="h-12 rounded-xl" />
            <Button onClick={addBlockedDate} disabled={!newBlockedDate} className="w-full transition-all duration-200">
              Agregar fecha bloqueada
            </Button>
          </div>
          <div className="space-y-3">
            {blockedDates.map((blocked) => (
              <div key={blocked.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-muted/40">
                <div>
                  <p className="font-medium">{new Date(blocked.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  {blocked.reason && <p className="text-sm text-muted-foreground">{blocked.reason}</p>}
                </div>
                <Button onClick={() => removeBlockedDate(blocked.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive transition-all duration-200">
                  <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                </Button>
              </div>
            ))}
            {blockedDates.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">No hay fechas bloqueadas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
