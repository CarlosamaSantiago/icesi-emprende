import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stat } from '@/components/ui/charts';
import { PageHeader } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/form';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { PagosAdminResponse } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { formatCOP, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Pagos y comisiones' };

/** HU-44: payments recorded by sellers, with CIEI commission (10%) and gateway cost (2%). */
export default async function AdminPagosPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  await requireSession('ADMIN');
  const { desde, hasta } = await searchParams;
  const data = await api<PagosAdminResponse>('/admin/pagos', { query: { desde, hasta } });
  const t = data.totales;

  return (
    <>
      <PageHeader title="Pagos y comisiones" subtitle="Solo los pagos confirmados suman a los totales" />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Desde" htmlFor="desde">
          <Input id="desde" name="desde" type="date" defaultValue={desde} />
        </Field>
        <Field label="Hasta" htmlFor="hasta">
          <Input id="hasta" name="hasta" type="date" defaultValue={hasta} />
        </Field>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Monto confirmado"
          value={formatCOP(t.montoConfirmado)}
          hint={`${t.pagosConfirmados} pagos`}
        />
        <Stat label="Comisión CIEI" value={formatCOP(t.comisionCiei)} />
        <Stat label="Costo pasarela" value={formatCOP(t.costoPasarela)} />
        <Stat label="Fallidos / reembolsados" value={`${t.fallidos} / ${t.reembolsados}`} />
      </div>
      {data.items.length === 0 ? (
        <p className="text-[13.5px] text-muted">No hay pagos registrados en este periodo.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Emprendimiento</Th>
              <Th>Estado</Th>
              <Th className="text-right">Monto</Th>
              <Th className="text-right">Comisión</Th>
              <Th className="text-right">Pasarela</Th>
              <Th>Referencia</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <Tr key={p.id}>
                <Td>
                  #{p.pedidoId}
                  <p className="text-xs text-muted">{formatDate(p.fechaPedido)}</p>
                </Td>
                <Td>
                  <Link href={`/emprendimientos/${p.emprendimiento.id}`} className="hover:text-primary">
                    {p.emprendimiento.nombre}
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={p.estado} />
                </Td>
                <Td className="text-right">{formatCOP(p.monto)}</Td>
                <Td className="text-right">{formatCOP(p.comisionCiei)}</Td>
                <Td className="text-right">{formatCOP(p.costoPasarela)}</Td>
                <Td className="text-muted">{p.referencia ?? '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
