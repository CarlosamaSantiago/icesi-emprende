import { ArrowLeft, Award, CalendarDays, PackageOpen, Star, User } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { RatingStars } from '@/components/ui/rating';
import { ReviewsList } from '@/features/ratings/components/reviews-list';
import { getCalificacionesEmprendimiento } from '@/features/ratings/queries';
import { ProductCard } from '@/features/marketplace/components/product-card';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { getEmprendimiento } from '@/features/marketplace/queries';
import { isNotFound } from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';

type Props = { params: Promise<{ id: string }> };

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();
  try {
    return await getEmprendimiento(id);
  } catch (e) {
    if (isNotFound(e)) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await load((await params).id)).nombre };
}

/** HU-08: public business page with its available catalog. */
export default async function EmprendimientoPage({ params }: Props) {
  const [e, session] = await Promise.all([load((await params).id), getSession()]);
  const resumen = await getCalificacionesEmprendimiento(e.id);

  return (
    <>
      <Link
        href="/marketplace"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver al marketplace
      </Link>

      <Card className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        <ProductImage src={e.logoUrl} alt={`Logo de ${e.nombre}`} className="size-28 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{e.categoria.nombre}</Badge>
            <StatusBadge status={e.estado} />
            {e.delMes && (
              <Badge tone="accent">
                <Award className="size-3" aria-hidden /> Emprendimiento del Mes
              </Badge>
            )}
            {e.destacado && (
              <Badge tone="warning">
                <Star className="size-3 fill-current" aria-hidden /> Destacado
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-extrabold">{e.nombre}</h1>
          <RatingStars value={resumen.promedio} total={resumen.total} className="mt-2" />
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{e.descripcion}</p>
          <div className="mt-4 flex flex-wrap gap-5 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4" aria-hidden /> {e.propietario.nombreCompleto}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Semestre {e.semestre.periodo}
            </span>
          </div>
        </div>
      </Card>

      <h2 className="mb-4 text-lg font-bold">Catálogo</h2>
      {e.productos.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Sin productos disponibles"
          description="Este emprendimiento aún no tiene productos activos."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {e.productos.map((p) => (
            <ProductCard key={p.id} producto={p} authenticated={!!session} />
          ))}
        </div>
      )}

      <section className="mt-10" aria-labelledby="opiniones">
        <h2 id="opiniones" className="mb-4 text-lg font-bold">
          Opiniones de compradores
        </h2>
        <ReviewsList resumen={resumen} emptyText="Aún no hay opiniones sobre este emprendimiento." />
      </section>
    </>
  );
}
