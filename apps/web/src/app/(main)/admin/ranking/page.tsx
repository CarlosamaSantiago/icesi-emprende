import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/feedback';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { api } from '@/lib/api/client';
import type { RankingResponse, SemestreAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { cn, formatCOP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Ranking de emprendimientos' };

/** HU-35: ranking by valid sales of a semester (cancelled / refunded / failed-payment orders excluded). */
export default async function AdminRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ semestre?: string }>;
}) {
  await requireSession('ADMIN');
  const { semestre } = await searchParams;
  const semestres = await api<SemestreAdmin[]>('/admin/semestres');
  const ranking = await api<RankingResponse>('/admin/ranking', { query: { semestreId: semestre } });

  return (
    <>
      <PageHeader
        title="Ranking de emprendimientos"
        subtitle={`Semestre ${ranking.semestre.periodo} · solo ventas válidas`}
      />
      <nav aria-label="Semestre" className="mb-5 flex flex-wrap gap-2">
        {semestres.map((s) => (
          <Link
            key={s.id}
            href={`/admin/ranking?semestre=${s.id}`}
            aria-current={ranking.semestre.id === s.id ? 'page' : undefined}
            className={cn(
              'rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold',
              ranking.semestre.id === s.id
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-muted hover:border-primary',
            )}
          >
            {s.periodo}
          </Link>
        ))}
      </nav>
      {ranking.items.length === 0 ? (
        <p className="text-[13.5px] text-muted">No hay emprendimientos en este semestre.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Emprendimiento</Th>
              <Th>Categoría</Th>
              <Th className="text-right">Pedidos</Th>
              <Th className="text-right">Unidades</Th>
              <Th className="text-right">Ventas</Th>
            </tr>
          </thead>
          <tbody>
            {ranking.items.map((r) => (
              <Tr key={r.emprendimientoId}>
                <Td className="font-extrabold text-primary">{r.posicion}</Td>
                <Td>
                  <Link
                    href={`/emprendimientos/${r.emprendimientoId}`}
                    className="font-semibold hover:text-primary"
                  >
                    {r.nombre}
                  </Link>
                  <p className="text-xs text-muted">{r.propietario}</p>
                </Td>
                <Td className="text-muted">{r.categoria}</Td>
                <Td className="text-right">{r.pedidosValidos}</Td>
                <Td className="text-right">{r.unidades}</Td>
                <Td className="text-right font-semibold">{formatCOP(r.ventas)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
