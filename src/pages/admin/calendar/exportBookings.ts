import type { Booking } from '../../../lib/supabase';
import { STATUS_LABELS } from './types';

const PAYMENT_LABELS: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  rejected: 'Rechazado',
};

const COLUMNS = [
  { label: 'Fecha', width: 22 },
  { label: 'Hora', width: 14 },
  { label: 'Codigo', width: 26 },
  { label: 'Cliente', width: 45 },
  { label: 'Telefono', width: 28 },
  { label: 'Email', width: 42 },
  { label: 'Estado', width: 24 },
  { label: 'Pago', width: 20 },
  { label: 'Monto', width: 20 },
  { label: 'Notas', width: 28 },
];

const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

function formatBookingDate(date: string): string {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function formatAmount(amount: number): string {
  if (amount == null) return '';
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  });
}

export function sortBookings(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    if (a.booking_date !== b.booking_date) return a.booking_date.localeCompare(b.booking_date);
    return a.booking_time.localeCompare(b.booking_time);
  });
}

function buildRows(bookings: Booking[]): string[][] {
  return sortBookings(bookings).map(b => [
    formatBookingDate(b.booking_date),
    b.booking_time?.slice(0, 5) || '',
    b.booking_code || '',
    b.customer_name || '',
    b.customer_phone || '',
    b.customer_email || '',
    STATUS_LABELS[b.booking_status] || b.booking_status || '',
    PAYMENT_LABELS[b.payment_status] || b.payment_status || '',
    formatAmount(b.amount),
    b.notas_admin || '',
  ]);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportBookingsCSV(bookings: Booking[], filename: string) {
  const escapeCell = (value: string) => {
    if (/[";\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const header = COLUMNS.map(c => escapeCell(c.label)).join(';');
  const lines = buildRows(bookings).map(row => row.map(escapeCell).join(';'));
  const csv = '\uFEFF' + [header, ...lines].join('\r\n');

  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export async function exportBookingsPDF(
  bookings: Booking[],
  options: { businessName: string; rangeLabel: string; filename: string }
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const rows = buildRows(bookings);
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - 14;
  const headHeight = 9;
  const rowHeight = 7;
  let y = 0;

  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text('Reservas', margin, 18);

  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(options.businessName, margin, 26);
  doc.text(`${options.rangeLabel} · ${bookings.length} reservas`, margin, 32);
  doc.setTextColor(20, 20, 20);

  y = 40;

  const drawHeadings = () => {
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, y - 5.5, TABLE_WIDTH, headHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    let x = margin;
    COLUMNS.forEach(column => {
      doc.text(column.label, x + 1.5, y);
      x += column.width;
    });
    doc.setTextColor(20, 20, 20);
    y += headHeight;
  };

  drawHeadings();

  rows.forEach((row, index) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = 20;
      drawHeadings();
    }

    if (index % 2 === 0) {
      doc.setFillColor(246, 248, 247);
      doc.rect(margin, y - 5, TABLE_WIDTH, rowHeight, 'F');
    }

    doc.setFontSize(8);
    let x = margin;
    COLUMNS.forEach((column, columnIndex) => {
      const cell = doc.splitTextToSize(row[columnIndex] || '', column.width - 3)[0] || '';
      doc.text(cell, x + 1.5, y);
      x += column.width;
    });

    y += rowHeight;
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Pagina ${page} de ${totalPages}`, pageWidth(doc) - margin, pageHeight - 6, {
      align: 'right',
    });
  }

  doc.save(`${options.filename}.pdf`);
}

function pageWidth(doc: { internal: { pageSize: { getWidth: () => number } } }): number {
  return doc.internal.pageSize.getWidth();
}
