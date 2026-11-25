import { Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { RatingStars } from '@/components/ui/rating';
import { DeleteRatingButton, RatingDialog } from '@/features/ratings/components/rating-dialog';
import { getMisCalificaciones } from '@/features/ratings/queries';
import { requireSession } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Mis calificaciones' };

/** HU-40: the user's own product opinions, to edit or withdraw. */
export default async function MisCalificacionesPage() {
  await requireSession();
  const items = await getMisCalificaciones();
  return (
    <>
      <PageHeader title="Mis calificaciones" subtitle="Tus opiniones sobre productos" />
      {items.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Aún no has calificado productos"
          description="Después de recibir un pedido puedes opinar desde la página del producto."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((c) => (
            <Card key={c.id} className="space-y-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/productos/${c.producto.id}`} className="font-bold hover:text-primary">
                    {c.producto.nombre}
                  </Link>
                  <p className="text-xs text-muted">
                    {c.emprendimiento.nombre} · {formatDate(c.fecha)}
                  </p>
                </div>
                <RatingStars value={c.puntuacion} size="sm" />
              </div>
              {c.comentario && <p className="text-[13.5px] whitespace-pre-line">{c.comentario}</p>}
              <div className="flex gap-2 pt-1">
                <RatingDialog
                  target={{ kind: 'edicion', id: c.id }}
                  title="Editar tu opinión"
                  initial={{ puntuacion: c.puntuacion, comentario: c.comentario }}
                  trigger={
                    <Button size="sm" variant="soft">
                      Editar
                    </Button>
                  }
                />
                <DeleteRatingButton id={c.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
