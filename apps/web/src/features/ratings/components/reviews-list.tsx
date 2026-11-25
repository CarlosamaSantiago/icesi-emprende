import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/ui/rating';
import type { ResumenCalificaciones } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';
import { DeleteRatingButton, RatingDialog } from './rating-dialog';

/** Summary + list of opinions (HU-38 for businesses, HU-39/40 for products when `editable`). */
export function ReviewsList({
  resumen,
  editable,
  emptyText = 'Aún no hay opiniones.',
}: {
  resumen: ResumenCalificaciones;
  editable?: boolean;
  emptyText?: string;
}) {
  return (
    <div>
      <RatingStars value={resumen.promedio} total={resumen.total} />
      {resumen.items.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-md border border-border">
          {resumen.items.map((c) => (
            <li key={c.id} className="space-y-1.5 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold">
                  {c.autor}
                  {c.esMia && <span className="ml-1.5 text-xs font-normal text-primary">(tú)</span>}
                </span>
                <span className="text-xs text-muted">{formatDate(c.fecha)}</span>
              </div>
              <RatingStars value={c.puntuacion} size="sm" />
              {c.comentario && <p className="text-[13.5px] whitespace-pre-line">{c.comentario}</p>}
              {editable && c.esMia && (
                <div className="flex gap-2 pt-1">
                  <RatingDialog
                    target={{ kind: 'edicion', id: c.id }}
                    title="Editar tu opinión"
                    initial={{ puntuacion: c.puntuacion, comentario: c.comentario }}
                    trigger={
                      <Button size="sm" variant="soft">
                        <Pencil aria-hidden /> Editar
                      </Button>
                    }
                  />
                  <DeleteRatingButton id={c.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
