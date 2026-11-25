import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/feedback';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api/client';
import type { EmprendimientoResumen, SemestreAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { cn, formatCOP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Emprendimientos por semestre' };

/** HU-29. ADMIN only. */
export default async function AdminSemestresPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  await requireSession('ADMIN');
  const { semestre } = await searchParams;
  const semestres = await api<SemestreAdmin[]>('/admin/semestres');
  const selected = semestres.find((s) => String(s.id) === semestre) ?? semestres[0];
  const items = selected
    ? await api<EmprendimientoResumen[]>(`/admin/semestres/${selected.id}/emprendimientos`)
    : [];

  return (
    <>
      <PageHeader title="Emprendimientos por semestre" subtitle="Compara las cohortes de emprendedores" />
      <nav aria-label="Semestre" className="mb-5 flex flex-wrap gap-2">
        {semestres.map((s) => (
          <Link
            key={s.id}
            href={`/admin/semestres?semestre=${s.id}`}
            aria-current={selected?.id === s.id ? 'page' : undefined}
            className={cn(
              'rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold',
              selected?.id === s.id
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-muted hover:border-primary',
            )}
          >
            {s.periodo} ({s.emprendimientos})
          </Link>
        ))}
      </nav>
      {selected && (
        <p className="mb-4 text-[13.5px] text-muted">
          {selected.emprendimientos} emprendimientos ({selected.activos} activos) · {selected.pedidosValidos}{' '}
          pedidos válidos · ventas {formatCOP(selected.ventas)}
        </p>
      )}
      {items.length === 0 ? (
        <p className="text-[13.5px] text-muted">Este semestre no tiene emprendimientos.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Emprendimiento</Th>
              <Th>Propietario</Th>
              <Th>Categoría</Th>
              <Th>Productos</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <Link href={`/emprendimientos/${e.id}`} className="font-semibold hover:text-primary">
                    {e.nombre}
                  </Link>
                </Td>
                <Td className="text-muted">{e.propietario.nombreCompleto}</Td>
                <Td className="text-muted">{e.categoria.nombre}</Td>
                <Td>{e.totalProductos}</Td>
                <Td>
                  <StatusBadge status={e.estado} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
