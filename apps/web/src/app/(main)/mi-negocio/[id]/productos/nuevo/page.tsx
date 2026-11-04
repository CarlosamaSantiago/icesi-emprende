import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { ProductForm } from '@/features/business/components/product-form';
import { loadOwned } from '@/features/business/load';
import { getMyBusiness } from '@/features/business/queries';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Nuevo producto' };

/** HU-11 */
export default async function NuevoProductoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const e = await loadOwned((await params).id, getMyBusiness);
  return (
    <>
      <Link
        href={`/mi-negocio/${e.id}/productos`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Catálogo de {e.nombre}
      </Link>
      <PageHeader title="Nuevo producto o servicio" subtitle={`Se publicará en ${e.nombre}`} />
      <Card className="max-w-2xl">
        <ProductForm businessId={e.id} />
      </Card>
    </>
  );
}
