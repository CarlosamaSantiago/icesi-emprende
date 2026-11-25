import { ArrowLeft, Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { RatingDialog } from '@/features/ratings/components/rating-dialog';
import { ReviewsList } from '@/features/ratings/components/reviews-list';
import { getCalificacionesProducto } from '@/features/ratings/queries';
import { ProductGallery } from '@/features/marketplace/components/product-gallery';
import { ProductPurchase } from '@/features/marketplace/components/product-purchase';
import { getProducto } from '@/features/marketplace/queries';
import { isNotFound } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { formatCOP } from '@/lib/utils';

type Props = { params: Promise<{ id: string }> };

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();
  try {
    return await getProducto(id);
  } catch (e) {
    if (isNotFound(e)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).id);
  return { title: p.nombre };
}

/** HU-17: detail — name, description, price, stock, images, link to the business. */
export default async function ProductoPage({ params }: Props) {
  const [producto, session] = await Promise.all([load((await params).id), getSession()]);
  const resumen = await getCalificacionesProducto(producto.id);
  const miOpinion = resumen.items.some((i) => i.esMia);

  return (
    <>
      <Link
        href="/marketplace"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver al marketplace
      </Link>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={producto.imagenes} alt={producto.nombre} />
        <Card className="h-fit">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{producto.emprendimiento.categoria}</Badge>
            {producto.estado !== 'ACTIVO' && <StatusBadge status={producto.estado} />}
          </div>
          <h1 className="text-2xl font-extrabold">{producto.nombre}</h1>
          <Link
            href={`/emprendimientos/${producto.emprendimiento.id}`}
            className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
          >
            <Store className="size-4" aria-hidden /> {producto.emprendimiento.nombre}
          </Link>
          <p className="mt-5 text-3xl font-extrabold text-primary">{formatCOP(producto.precio)}</p>
          <p className="mt-1 text-[13px] text-muted">
            {producto.stockDisponible > 0
              ? `${producto.stockDisponible} unidades disponibles`
              : 'Sin existencias'}
          </p>
          <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line">{producto.descripcion}</p>
          <div className="mt-7 border-t border-border pt-6">
            <ProductPurchase producto={producto} authenticated={!!session} />
          </div>
        </Card>
      </div>
      <section className="mt-10" aria-labelledby="opiniones">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="opiniones" className="text-lg font-bold">
            Opiniones
          </h2>
          {resumen.puedeCalificar && !miOpinion && (
            <RatingDialog
              target={{ kind: 'producto', productoId: producto.id }}
              title={`Califica ${producto.nombre}`}
              trigger={<Button size="sm">Escribir opinión</Button>}
            />
          )}
        </div>
        <ReviewsList resumen={resumen} editable emptyText="Aún no hay opiniones sobre este producto." />
      </section>
    </>
  );
}
