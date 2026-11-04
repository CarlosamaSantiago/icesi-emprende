import { ArrowLeft, Info } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { BusinessForm } from '@/features/business/components/business-form';
import { BusinessLogo } from '@/features/business/components/business-logo';
import { loadOwned } from '@/features/business/load';
import { getMyBusiness } from '@/features/business/queries';
import { getCategorias } from '@/features/marketplace/queries';
import { requireSession } from '@/lib/auth/session';
import { mediaUrl } from '@/lib/media';

export const metadata: Metadata = { title: 'Editar emprendimiento' };

/** HU-07 (+ logo for HU-05). The API returns 404 if the user does not own it (HU-07 CA3). */
export default async function EditarEmprendimientoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  const [e, categorias] = await Promise.all([loadOwned(id, getMyBusiness), getCategorias()]);

  return (
    <>
      <Link
        href="/mi-negocio"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Mis emprendimientos
      </Link>
      <PageHeader
        title={e.nombre}
        subtitle="Información comercial"
        actions={<StatusBadge status={e.estado} />}
      />
      {(nuevo || e.estado === 'PENDIENTE') && (
        <p
          role="status"
          className="mb-6 flex items-start gap-2 rounded-md bg-primary-soft px-4 py-3 text-[13px] text-primary"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Tu emprendimiento está pendiente de aprobación por el CIEI. Mientras tanto, agrega tu logo y tus{' '}
          <Link href={`/mi-negocio/${e.id}/productos`} className="font-semibold underline">
            productos
          </Link>
          .
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <BusinessForm categorias={categorias} emprendimiento={e} />
        </Card>
        <Card className="h-fit">
          <CardHeader className="block">
            <CardTitle>Logo</CardTitle>
            <CardDescription>Se muestra en el marketplace y en tu ficha pública.</CardDescription>
          </CardHeader>
          <BusinessLogo businessId={e.id} currentUrl={mediaUrl(e.logoUrl)} />
        </Card>
      </div>
    </>
  );
}
