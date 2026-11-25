import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/feedback';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { DesignateForm } from '@/features/admin/components/designate-form';
import { api } from '@/lib/api/client';
import type { DelMesItem, EmprendimientoAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Emprendimiento del Mes' };

/** HU-46. ADMIN only. */
export default async function AdminDelMesPage() {
  await requireSession('ADMIN');
  const [all, historial] = await Promise.all([
    api<EmprendimientoAdmin[]>('/admin/emprendimientos'),
    api<DelMesItem[]>('/admin/emprendimiento-del-mes'),
  ]);
  const activos = all.filter((e) => e.estado === 'ACTIVO');
  const now = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7);

  return (
    <>
      <PageHeader
        title="Emprendimiento del Mes"
        subtitle="El reconocimiento aparece como insignia en el marketplace y notifica al emprendedor"
      />
      <div className="mb-8 rounded-lg border border-border bg-surface p-5">
        <DesignateForm options={activos.map((e) => ({ id: e.id, nombre: e.nombre }))} defaultPeriodo={now} />
      </div>
      <h2 className="mb-3 text-[15px] font-bold">Historial</h2>
      {historial.length === 0 ? (
        <p className="text-[13.5px] text-muted">Aún no hay designaciones.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Mes</Th>
              <Th>Emprendimiento</Th>
              <Th>Designado por</Th>
              <Th>Fecha</Th>
            </tr>
          </thead>
          <tbody>
            {historial.map((h) => (
              <Tr key={h.id}>
                <Td className="font-semibold">{h.periodo}</Td>
                <Td>{h.emprendimiento}</Td>
                <Td className="text-muted">{h.designadoPor ?? '—'}</Td>
                <Td className="text-muted">{formatDate(h.fecha)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
