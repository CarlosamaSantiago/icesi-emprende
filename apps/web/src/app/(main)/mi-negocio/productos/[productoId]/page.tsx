import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { ProductForm } from '@/features/business/components/product-form';
import { ProductImagesManager } from '@/features/business/components/product-images-manager';
import { ProductStatusToggle } from '@/features/business/components/product-status-toggle';
import { loadOwned } from '@/features/business/load';
import { getMyProduct } from '@/features/business/queries';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Editar producto' };

/** HU-12 (edit) + HU-13 (status) + HU-14 (gallery). Non-owners get 404 (HU-12 CA3). */
export default async function EditarProductoPage({ params }: { params: Promise<{ productoId: string }> }) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const p = await loadOwned((await params).productoId, getMyProduct);

  return (
    <>
      <Link
        href={`/mi-negocio/${p.emprendimiento.id}/productos`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Catálogo de {p.emprendimiento.nombre}
      </Link>
      <PageHeader
        title={p.nombre}
        actions={
          <>
            <StatusBadge status={p.estado} />
            <ProductStatusToggle productoId={p.id} estado={p.estado} />
            <Button asChild size="sm" variant="ghost">
              <Link href={`/productos/${p.id}`}>
                <ExternalLink aria-hidden /> Ver publicación
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="block">
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <ProductForm businessId={p.emprendimiento.id} producto={p} />
        </Card>
        <Card className="h-fit">
          <CardHeader className="block">
            <CardTitle>Galería</CardTitle>
            <CardDescription>La primera imagen se usa como principal en el marketplace.</CardDescription>
          </CardHeader>
          <ProductImagesManager productoId={p.id} imagenes={p.imagenes} />
        </Card>
      </div>
    </>
  );
}
