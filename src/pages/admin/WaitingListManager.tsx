import { useState } from 'react';
import { Search, Phone, Mail, Calendar, Trash2, RefreshCw, ClipboardList } from 'lucide-react';
import { WaitingListItem } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { authInvoke } from './helpers';

const ESTADO_BADGE: Record<string, 'warning' | 'info' | 'success' | 'destructive'> = {
  pendiente: 'warning',
  contactado: 'info',
  convertido: 'success',
  cancelado: 'destructive',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  contactado: 'Contactado',
  convertido: 'Convertido',
  cancelado: 'Cancelado',
};

export function WaitingListManager({
  waitingList, onRefresh
}: {
  waitingList: WaitingListItem[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [saving, setSaving] = useState<string | null>(null);

  const updateItem = async (id: string, estado?: string, action?: string) => {
    setSaving(id);
    try {
      const { data, error } = await authInvoke('admin-update-waiting-list', {
        id, estado, action,
      });
      if (error || !data?.success) throw new Error('Error');
      onRefresh();
    } catch {
      alert('Error al actualizar');
    } finally {
      setSaving(null);
    }
  };

  const filtered = waitingList.filter(w => {
    const matchesSearch = w.nombre.toLowerCase().includes(search.toLowerCase()) ||
      w.telefono.includes(search) || w.email.toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filterEstado === 'all' || w.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  return (
    <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display">Lista de espera</CardTitle>
            <CardDescription>
              {waitingList.filter(w => w.estado === 'pendiente').length} pendientes de {waitingList.length} total
            </CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre, teléfono o email..." value={search}
              onChange={e => setSearch(e.target.value)} className="h-12 rounded-xl pl-9" />
          </div>
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="flex h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200">
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="convertido">Convertido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
            <p className="text-muted-foreground">No hay registros en la lista de espera</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-muted/40">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.nombre}</p>
                      <Badge variant={ESTADO_BADGE[item.estado] || 'secondary'}>
                        {ESTADO_LABEL[item.estado]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <Phone className="mr-1 inline h-3 w-3" />{item.telefono}
                      <span className="mx-2">·</span>
                      <Mail className="mr-1 inline h-3 w-3" />{item.email}
                      <span className="mx-2">·</span>
                      <Calendar className="mr-1 inline h-3 w-3" />{formatDate(item.fecha_deseada)}
                      {item.horario_deseado && <span className="ml-2">{item.horario_deseado.slice(0, 5)} hs</span>}
                      {item.servicio && <span className="ml-2">· {item.servicio}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {item.estado === 'pendiente' && (
                      <Button onClick={() => updateItem(item.id, 'contactado')} disabled={saving === item.id}
                        variant="secondary" size="sm">
                        Contactar
                      </Button>
                    )}
                    {(item.estado === 'pendiente' || item.estado === 'contactado') && (
                      <Button onClick={() => updateItem(item.id, 'convertido')} disabled={saving === item.id}
                        size="sm">
                        Convertido
                      </Button>
                    )}
                    {item.estado !== 'cancelado' && item.estado !== 'convertido' && (
                      <Button onClick={() => updateItem(item.id, 'cancelado')} disabled={saving === item.id}
                        variant="outline" size="sm" className="text-destructive">
                        Cancelar
                      </Button>
                    )}
                    <Button onClick={() => updateItem(item.id, undefined, 'delete')} disabled={saving === item.id}
                      variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
