import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { DecisionActions } from '@/features/admin/components/decision-actions';
import { BusinessAdminActions } from '@/features/admin/components/business-admin-actions';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { api } from '@/lib/api/client';
import type { EmprendimientoAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { cn, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Administrar emprendimientos' };

const FILTERS = ['TODOS', 'PENDIENTE', 'ACTIVO', 'INACTIVO'] as const;

/** HU-09 (visibility) + HU-10 (featured). ADMIN only — enforced again by the API. */
export default async function AdminEmprendimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireSession('ADMIN');
  const { estado = 'TODOS' } = await searchParams;
  const all = await api<EmprendimientoAdmin[]>('/admin/emprendimientos');
  const items = estado === 'TODOS' ? all : all.filter((e) => e.estado === estado);

  return (
    <>
      <PageHeader
        title="Emprendimientos"
        subtitle="Aprueba nuevos emprendimientos y controla visibilidad y destacados"
      />
      <nav aria-label="Filtrar por estado" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === 'TODOS' ? '/admin/emprendimientos' : `/admin/emprendimientos?estado=${f}`}
            aria-current={estado === f ? 'page' : undefined}
            className={cn(
              'rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold capitalize',
              estado === f
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-muted hover:border-primary',
            )}
          >
            {f.toLowerCase()} ({f === 'TODOS' ? all.length : all.filter((e) => e.estado === f).length})
          </Link>
        ))}
      </nav>
      <Table>
        <thead>
          <tr>
            <Th>Emprendimiento</Th>
            <Th>Propietario</Th>
            <Th>Categoría</Th>
            <Th>Semestre</Th>
            <Th>Estado</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <Tr key={e.id}>
              <Td>
                <Link
                  href={`/emprendimientos/${e.id}`}
                  className="flex items-center gap-3 font-semibold hover:text-primary"
                >
                  <ProductImage src={e.logoUrl} alt="" className="size-10 rounded-md" />
                  {e.nombre}
                </Link>
              </Td>
              <Td className="text-muted">{e.propietario.nombreCompleto}</Td>
              <Td className="text-muted">{e.categoria.nombre}</Td>
              <Td className="text-muted">{e.semestre.periodo}</Td>
              <Td>
                <StatusBadge status={e.estado} />
                {e.ultimaDecision && (
                  <p className="mt-1 max-w-56 text-xs text-muted">
                    {e.ultimaDecision.decision === 'APROBADO' ? 'Aprobado' : 'Rechazado'} por{' '}
                    {e.ultimaDecision.admin ?? 'un administrador'} · {formatDate(e.ultimaDecision.fecha)}
                    {e.ultimaDecision.motivo && <> — {e.ultimaDecision.motivo}</>}
                  </p>
                )}
              </Td>
              <Td>
                {e.estado === 'PENDIENTE' ||
                (e.estado === 'INACTIVO' && e.ultimaDecision?.decision === 'RECHAZADO') ? (
                  <DecisionActions emprendimiento={e} />
                ) : (
                  <BusinessAdminActions emprendimiento={e} />
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
