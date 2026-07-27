import { useState } from 'react';
import { Search, Phone, Mail, Trash2, Download, FileText, Users } from 'lucide-react';
import { Booking } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { authInvoke } from './helpers';

interface ClientData {
  name: string;
  phone: string;
  email: string;
  firstBooking: string;
  lastBooking: string;
  totalBookings: number;
}

export function ClientsManager({
  bookings, onRefresh, setConfirmModal, showSuccess,
}: {
  bookings: Booking[];
  onRefresh: () => void;
  setConfirmModal: (modal: { open: boolean; message: string; onConfirm: () => void }) => void;
  showSuccess: (msg: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const clientMap = new Map<string, ClientData>();
  bookings.forEach((b) => {
    const key = b.customer_email || b.customer_phone;
    if (clientMap.has(key)) {
      const c = clientMap.get(key)!;
      c.totalBookings += 1;
      if (b.booking_date > c.lastBooking) c.lastBooking = b.booking_date;
      if (b.booking_date < c.firstBooking) c.firstBooking = b.booking_date;
    } else {
      clientMap.set(key, {
        name: b.customer_name,
        phone: b.customer_phone,
        email: b.customer_email,
        firstBooking: b.booking_date,
        lastBooking: b.booking_date,
        totalBookings: 1,
      });
    }
  });

  let clients = Array.from(clientMap.values());

  if (search) {
    clients = clients.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (dateFrom) clients = clients.filter(c => c.firstBooking >= dateFrom);
  if (dateTo) clients = clients.filter(c => c.lastBooking <= dateTo);

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  const deleteClient = async (email: string, phone: string) => {
    const key = email || phone;
    const relatedBookings = bookings.filter(b => (b.customer_email || b.customer_phone) === key);
    if (relatedBookings.length === 0) return;

    setConfirmModal({
      open: true,
      message: `Se moverán a la papelera ${relatedBookings.length} reserva(s) de este cliente.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: () => {} });
        try {
          for (const b of relatedBookings) {
            await authInvoke('admin-delete-booking', {
              booking_id: b.id,
            });
          }
          onRefresh();
          showSuccess('Cliente movido a la papelera');
        } catch {
          showSuccess('Error al eliminar el cliente');
        }
      },
    });
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'WhatsApp', 'Email', 'Primera reserva', 'Última reserva', 'Total reservas'];
    const rows = clients.map(c => [
      c.name, c.phone, c.email,
      formatDate(c.firstBooking), formatDate(c.lastBooking),
      c.totalBookings
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Listado de Clientes', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);
    let y = 40;
    const lineH = 8;
    doc.setFillColor(16, 185, 129);
    doc.rect(14, y - 5, 182, lineH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Nombre', 16, y);
    doc.text('WhatsApp', 70, y);
    doc.text('Email', 105, y);
    doc.text('Registro', 148, y);
    doc.text('Reservas', 178, y);
    y += lineH;
    doc.setTextColor(0, 0, 0);
    clients.forEach((c, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, lineH, 'F');
      }
      doc.setFontSize(8);
      doc.text(c.name.slice(0, 20), 16, y);
      doc.text(c.phone.slice(0, 15), 70, y);
      doc.text(c.email.slice(0, 22), 105, y);
      doc.text(formatDate(c.firstBooking), 148, y);
      y += lineH;
    });
    doc.save('clientes.pdf');
  };

  return (
    <Card className="shadow-[0_8px_30px_rgba(0,0,0,.05)] rounded-2xl border-border/60">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display">Clientes</CardTitle>
            <CardDescription>{clients.length} clientes encontrados</CardDescription>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportCSV} variant="secondary" size="sm" className="transition-all duration-200">
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button onClick={exportPDF} variant="destructive" size="sm" className="transition-all duration-200">
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar por nombre, teléfono o email..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="h-12 rounded-xl pl-9" />
          </div>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-12 w-auto rounded-xl" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-12 w-auto rounded-xl" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60">
                {['Nombre', 'WhatsApp', 'Email', 'Primera reserva', 'Última reserva', ''].map(h => (
                  <th key={h} className="px-3 py-4 text-left text-sm font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {clients.map((c) => (
                <tr key={c.email || c.phone} className="hover:bg-muted/40 transition-all duration-200">
                  <td className="px-3 py-4 font-medium">{c.name}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1.5 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>
                  </td>
                  <td className="px-3 py-4 text-sm">{formatDate(c.firstBooking)}</td>
                  <td className="px-3 py-4 text-sm">{formatDate(c.lastBooking)}</td>
                  <td className="px-3 py-4 text-right">
                    <button
                      onClick={() => deleteClient(c.email, c.phone)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-all duration-200">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-14 w-14 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
