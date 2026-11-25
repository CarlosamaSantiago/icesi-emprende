import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ColumnChart, Stat } from '@/components/ui/charts';
import { PageHeader } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/form';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { IndicadoresResponse } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { formatCOP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Indicadores institucionales' };

const compact = (n: number) =>
  new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** HU-36: GMV and activity per month. ADMIN only. */
export default async function AdminIndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requireSession('ADMIN');
  const { desde, hasta } = await searchParams;
  const data = await api<IndicadoresResponse>('/admin/indicadores', { query: { desde, hasta } });

  return (
    <>
      <PageHeader
        title="Indicadores institucionales"
        subtitle="GMV = ventas válidas (sin canceladas, reembolsadas ni con pago fallido)"
      />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Desde" htmlFor="desde">
          <Input id="desde" name="desde" type="month" defaultValue={data.desde} />
        </Field>
        <Field label="Hasta" htmlFor="hasta">
          <Input id="hasta" name="hasta" type="month" defaultValue={data.hasta} />
        </Field>
        <Button type="submit" variant="secondary">
          Aplicar
        </Button>
      </form>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="GMV" value={formatCOP(data.totales.gmv)} />
        <Stat label="Pedidos válidos" value={String(data.totales.pedidosValidos)} />
        <Stat
          label="Comisión CIEI"
          value={formatCOP(data.totales.comisionCiei)}
          hint="De pagos confirmados"
        />
        <Stat
          label="Costo pasarela"
          value={formatCOP(data.totales.costoPasarela)}
          hint="De pagos confirmados"
        />
      </div>
      <ColumnChart
        className="mb-6 rounded-lg border border-border bg-surface p-4"
        caption="GMV por mes"
        data={data.meses.map((m) => ({ label: m.mes, value: m.gmv }))}
        format={compact}
      />
      <Table>
        <thead>
          <tr>
            <Th>Mes</Th>
            <Th className="text-right">Pedidos</Th>
            <Th className="text-right">Emprendimientos activos</Th>
            <Th className="text-right">GMV</Th>
            <Th className="text-right">Comisión</Th>
            <Th className="text-right">Pasarela</Th>
          </tr>
        </thead>
        <tbody>
          {data.meses.map((m) => (
            <Tr key={m.mes}>
              <Td className="font-semibold">{m.mes}</Td>
              <Td className="text-right">{m.pedidosValidos}</Td>
              <Td className="text-right">{m.emprendimientosConActividad}</Td>
              <Td className="text-right">{formatCOP(m.gmv)}</Td>
              <Td className="text-right">{formatCOP(m.comisionCiei)}</Td>
              <Td className="text-right">{formatCOP(m.costoPasarela)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
