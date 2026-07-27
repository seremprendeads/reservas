import { ChevronLeft, ChevronRight, CalendarDays, Plus, Lock } from 'lucide-react';
import type { CalendarView } from './types';
import { formatDateDisplay, formatDateShort, getToday } from './calendarUtils';

interface CalendarHeaderProps {
  currentDate: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewBooking: () => void;
  onBlockedTimes: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewBooking,
  onBlockedTimes,
}: CalendarHeaderProps) {
  const getTitle = () => {
    if (view === 'day') return formatDateDisplay(currentDate);
    if (view === 'week') return `Semana del ${formatDateShort(currentDate)}`;
    const d = new Date(currentDate);
    return `${d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-display font-semibold text-foreground">{getTitle()}</h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(['day', 'week', 'month'] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                view === v
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onToday} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            Hoy
          </button>
          <button onClick={onNext} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onBlockedTimes}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline">Bloqueos</span>
        </button>

        <button
          onClick={onNewBooking}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Reserva</span>
        </button>
      </div>
    </div>
  );
}
