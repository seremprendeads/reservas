import { useMemo } from 'react';

// ============================================================================
// Seguimiento de pruebas: una fila por profesional con su línea de tiempo
// sobre los 18 días de prueba. Solo lectura, para monitorear el avance.
// ============================================================================

const TRIAL_DAYS = 18;

export interface TrialTenant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  is_active: boolean;
  plan: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  created_at: string;
}

type Row = {
  t: TrialTenant;
  estado: 'prueba' | 'vencida' | 'pago' | 'suspendido';
  diasUsados: number;
  diasRestantes: number;
  progreso: number;
  vence: string;
};

function buildRow(t: TrialTenant): Row {
  const end = t.trial_ends_at ? new Date(t.trial_ends_at) : null;
  const msRestantes = end ? end.getTime() - Date.now() : 0;
  const diasRestantes = end ? Math.max(0, Math.ceil(msRestantes / 86400000)) : 0;
  const diasUsados = Math.min(TRIAL_DAYS, Math.max(0, TRIAL_DAYS - diasRestantes));

  let estado: Row['estado'] = 'pago';
  if (!t.is_active) estado = 'suspendido';
  else if (t.is_trial && end && msRestantes <= 0) estado = 'vencida';
  else if (t.is_trial) estado = 'prueba';

  return {
    t,
    estado,
    diasUsados,
    diasRestantes,
    progreso: Math.round((diasUsados / TRIAL_DAYS) * 100),
    vence: end ? end.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—',
  };
}

const ESTADOS: Record<Row['estado'], { label: string; chip: string; bar: string }> = {
  prueba:     { label: 'En prueba',  chip: 'bg-amber-50 text-amber-700 border-amber-200', bar: '#F0A825' },
  vencida:    { label: 'Vencida',    chip: 'bg-red-50 text-red-700 border-red-200',       bar: '#D65745' },
  pago:       { label: 'Plan pago',  chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: '#2FA36B' },
  suspendido: { label: 'Suspendido', chip: 'bg-gray-100 text-gray-600 border-gray-200',   bar: '#9AA0A6' },
};

export function TrialTracking({ tenants, planLabel }: { tenants: TrialTenant[]; planLabel: (p: string) => string }) {
  const rows = useMemo(() => {
    const list = tenants.map(buildRow);
    // Primero las pruebas que están por vencer
    const orden = { prueba: 0, vencida: 1, pago: 2, suspendido: 3 };
    return list.sort((a, b) =>
      orden[a.estado] - orden[b.estado] || a.diasRestantes - b.diasRestantes,
    );
  }, [tenants]);

  const resumen = useMemo(() => ({
    prueba: rows.filter((r) => r.estado === 'prueba').length,
    porVencer: rows.filter((r) => r.estado === 'prueba' && r.diasRestantes <= 5).length,
    vencida: rows.filter((r) => r.estado === 'vencida').length,
    pago: rows.filter((r) => r.estado === 'pago').length,
  }), [rows]);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay profesionales cargados todavía.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'En prueba', value: resumen.prueba },
          { label: 'Vencen en 5 días o menos', value: resumen.porVencer },
          { label: 'Prueba vencida', value: resumen.vencida },
          { label: 'Con plan pago', value: resumen.pago },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-3xl text-foreground">{c.value}</p>
            <p className="mt-1 text-xs leading-4 text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Profesional</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium w-[260px]">Línea de prueba · {TRIAL_DAYS} días</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Restan</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Vence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const est = ESTADOS[r.estado];
              const mostrarBarra = r.estado === 'prueba' || r.estado === 'vencida';
              return (
                <tr key={r.t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{r.t.name}</p>
                    <p className="text-xs text-muted-foreground">{r.t.owner_email} · /{r.t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${est.chip}`}>
                      {est.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{planLabel(r.t.plan)}</td>
                  <td className="px-4 py-3">
                    {mostrarBarra ? (
                      <>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${r.progreso}%`, backgroundColor: est.bar }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Día {r.diasUsados} de {TRIAL_DAYS}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {mostrarBarra ? (
                      <span className={r.diasRestantes <= 5 ? 'font-semibold text-red-600' : 'text-foreground'}>
                        {r.diasRestantes} {r.diasRestantes === 1 ? 'día' : 'días'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{r.vence}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
