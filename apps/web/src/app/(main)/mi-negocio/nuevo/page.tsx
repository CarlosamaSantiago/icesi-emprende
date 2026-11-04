import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { BusinessForm } from '@/features/business/components/business-form';
import { getCategorias } from '@/features/marketplace/queries';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Nuevo emprendimiento' };

/** HU-05 — the logo is added in the next step (needs the created id). */
export default async function NuevoEmprendimientoPage() {
  const user = await requireSession('EMPRENDEDOR', 'ADMIN');
  const categorias = await getCategorias();
  return (
    <>
      <PageHeader title="Nuevo emprendimiento" subtitle={`Responsable: ${user.nombre} (${user.email})`} />
      <Card className="max-w-2xl">
        <BusinessForm categorias={categorias} />
      </Card>
    </>
  );
}
