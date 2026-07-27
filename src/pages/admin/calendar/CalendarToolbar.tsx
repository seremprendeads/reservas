import { Search, Filter, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { CalendarFilters } from './types';

interface CalendarToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
}

export function CalendarToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  summary,
}: CalendarToolbarProps) {
  const toggleStatus = (status: string) => {
    const current = filters.status;
    const next = current.includes(status) ? current.filter(s => s !== status) : [...current, status];
    onFiltersChange({ ...filters, status: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cliente, teléfono, email..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'pending', label: 'Pendientes', color: 'bg-amber-100 text-amber-700 border-amber-200' },
              { key: 'confirmed', label: 'Confirmadas', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
              { key: 'completed', label: 'Completadas', color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { key: 'cancelled', label: 'Canceladas', color: 'bg-gray-100 text-gray-500 border-gray-200' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => toggleStatus(f.key)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                  filters.status.includes(f.key)
                    ? f.color
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Reservas hoy</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pendientes</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-600">{summary.pending}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Confirmadas</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.confirmed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-muted-foreground">Canceladas</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-500">{summary.cancelled}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Ingresos</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-primary">${summary.revenue.toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  );
}
