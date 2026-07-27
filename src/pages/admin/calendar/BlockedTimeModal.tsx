import { useState } from 'react';
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import type { BlockedTimeBlock, BlockType } from './types';
import { BLOCK_TYPE_LABELS, BLOCK_TYPE_COLORS } from './types';
import { getToday } from './calendarUtils';

interface BlockedTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedTimes: BlockedTimeBlock[];
  onAdd: (block: Omit<BlockedTimeBlock, 'id'>) => void;
  onRemove: (id: string) => void;
}

export function BlockedTimeModal({
  isOpen,
  onClose,
  blockedTimes,
  onAdd,
  onRemove,
}: BlockedTimeModalProps) {
  const [date, setDate] = useState(getToday());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<BlockType>('break');
  const [reason, setReason] = useState('');

  const handleAdd = () => {
    onAdd({ date, startTime, endTime, type, reason: reason || BLOCK_TYPE_LABELS[type] });
    setReason('');
  };

  if (!isOpen) return null;

  const today = getToday();
  const futureBlocks = blockedTimes.filter(b => b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pastBlocks = blockedTimes.filter(b => b.date < today);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="text-lg font-display font-semibold text-foreground">Bloqueos de Horario</h3>
            <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="text-sm font-semibold text-foreground">Nuevo Bloqueo</h4>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={date}
                    min={today}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo</label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        type === t
                          ? `${BLOCK_TYPE_COLORS[t]} border-current`
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {BLOCK_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo (opcional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={BLOCK_TYPE_LABELS[type]}
                  className="w-full rounded-xl border border-border bg-card py-2 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <button
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar Bloqueo
              </button>
            </div>

            {futureBlocks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Próximos bloqueos</h4>
                <div className="space-y-2">
                  {futureBlocks.map(block => (
                    <div key={block.id} className={`flex items-center justify-between rounded-xl border p-3 ${BLOCK_TYPE_COLORS[block.type]}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{block.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(block.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {block.startTime} - {block.endTime}
                        </p>
                      </div>
                      <button onClick={() => onRemove(block.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastBlocks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Bloqueos anteriores ({pastBlocks.length})</h4>
                <div className="space-y-2">
                  {pastBlocks.slice(0, 10).map(block => (
                    <div key={block.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3 opacity-60">
                      <div>
                        <p className="text-sm font-medium text-foreground">{block.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(block.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {block.startTime} - {block.endTime}
                        </p>
                      </div>
                      <button onClick={() => onRemove(block.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/50 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockedTimes.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No hay bloqueos configurados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
