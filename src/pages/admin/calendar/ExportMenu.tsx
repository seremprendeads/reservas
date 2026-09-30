import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Table2 } from 'lucide-react';
import type { Booking } from '../../../lib/supabase';
import { exportBookingsCSV, exportBookingsPDF } from './exportBookings';

interface ExportMenuProps {
  bookings: Booking[];
  businessName: string;
  rangeLabel: string;
  filename: string;
}

export function ExportMenu({ bookings, businessName, rangeLabel, filename }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (bookings.length === 0) return null;

  const handlePDF = async () => {
    setBusy(true);
    try {
      await exportBookingsPDF(bookings, { businessName, rangeLabel, filename });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCSV = () => {
    exportBookingsCSV(bookings, filename);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{busy ? 'Preparando...' : 'Descargar'}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <p className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            {bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'} · {rangeLabel}
          </p>

          <button
            type="button"
            onClick={handlePDF}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">PDF</span>
              <span className="block text-xs text-muted-foreground">Para imprimir o compartir</span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleCSV}
            className="flex w-full items-start gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-muted"
          >
            <Table2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-medium text-foreground">CSV</span>
              <span className="block text-xs text-muted-foreground">Para abrir en Excel o filtrar</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
