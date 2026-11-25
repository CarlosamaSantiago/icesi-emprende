import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart, Stat } from '@/components/ui/charts';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { Field, Input, NativeSelect } from '@/components/ui/form';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { Metricas } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { formatCOP, formatDate } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Métricas de ventas' };

const ESTADO_TONE: Record<string, string> = {
  PENDIENTE: 'fill-warning',
  CONFIRMADO: 'fill-info',
  PREPARANDO: 'fill-accent',
  ENTREGADO: 'fill-success',
  CANCELADO: 'fill-danger',
};

/** HU-30..34: sales indicators, charts, date filters and PDF/CSV export for the seller's own businesses. */
export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; emprendimientoId?: string }>;
}) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const { desde, hasta, emprendimientoId } = await searchParams;
  const m = await api<Metricas>('/metricas', { query: { desde, hasta, emprendimientoId } });
  const qs = new URLSearchParams(
    Object.entries({ desde, hasta, emprendimientoId }).filter(([, v]) => v) as [string, string][],
  ).toString();
  const r = m.resumen;

  return (
    <>
      <PageHeader
        title="Métricas de ventas"
        subtitle={m.periodo}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <a href={`/metricas/pdf${qs ? `?${qs}` : ''}`}>
                <Download aria-hidden /> PDF
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={`/metricas/csv${qs ? `?${qs}` : ''}`}>
                <Download aria-hidden /> CSV
              </a>
            </Button>
          </>
        }
      />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Desde" htmlFor="desde">
          <Input id="desde" name="desde" type="date" defaultValue={desde} />
        </Field>
        <Field label="Hasta" htmlFor="hasta">
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
        </Field>
        <Field label="Emprendimiento" htmlFor="emprendimientoId">
          <NativeSelect id="emprendimientoId" name="emprendimientoId" defaultValue={emprendimientoId ?? ''}>
            <option value="">Todos</option>
            {m.emprendimientos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Button type="submit" variant="secondary">
          Aplicar
        </Button>
        {qs && (
          <Button asChild variant="ghost">
            <Link href="/metricas">Limpiar</Link>
          </Button>
        )}
      </form>

      {r.totalPedidos === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin pedidos en este periodo"
          description="Cuando recibas pedidos verás aquí tus indicadores y gráficos."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ingresos" value={formatCOP(r.ingresos)} hint="Solo pedidos válidos" />
            <Stat
              label="Pedidos válidos"
              value={String(r.pedidosValidos)}
              hint={`de ${r.totalPedidos} en total`}
            />
            <Stat label="Unidades vendidas" value={String(r.unidadesVendidas)} />
            <Stat label="Ticket promedio" value={formatCOP(r.ticketPromedio)} />
            <Stat
              label="Pendientes"
              value={String(r.pedidosPendientes)}
              hint={formatCOP(r.ingresosPendientes)}
            />
            <Stat
              label="Cancelados"
              value={String(r.pedidosCancelados)}
              hint={formatCOP(r.ingresosCancelados)}
            />
            <Stat label="Pago fallido" value={String(r.pedidosPagoFallido)} hint="No cuentan como ingreso" />
          </div>
          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 text-[14px] font-bold">Pedidos por estado</h2>
              <BarChart
                caption="Pedidos por estado"
                data={m.porEstado.map((e) => ({
                  label: e.estado.charAt(0) + e.estado.slice(1).toLowerCase(),
                  value: e.cantidad,
                  tone: ESTADO_TONE[e.estado],
                }))}
              />
            </section>
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 text-[14px] font-bold">Productos más vendidos (unidades)</h2>
              {m.productos.length === 0 ? (
                <p className="text-[13px] text-muted">Aún no hay ventas válidas.</p>
              ) : (
                <BarChart
                  caption="Productos más vendidos"
                  data={m.productos.slice(0, 8).map((p) => ({ label: p.nombre, value: p.unidades }))}
                />
              )}
            </section>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Pedido</Th>
                <Th>Comprador</Th>
                <Th>Emprendimiento</Th>
                <Th>Estado</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {m.pedidos.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    #{p.id}
                    <p className="text-xs text-muted">{formatDate(p.fecha)}</p>
                  </Td>
                  <Td>{p.comprador}</Td>
                  <Td className="text-muted">{p.emprendimiento}</Td>
                  <Td>
                    <StatusBadge status={p.estado} />
                  </Td>
                  <Td className="text-right font-semibold">{formatCOP(p.total)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}
