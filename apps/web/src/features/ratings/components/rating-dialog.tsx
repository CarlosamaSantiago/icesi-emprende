'use client';

import { Star } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  deleteProductRatingAction,
  rateOrderAction,
  rateProductAction,
  updateProductRatingAction,
} from '../actions';

type Target =
  | { kind: 'pedido'; pedidoId: number }
  | { kind: 'producto'; productoId: number }
  | { kind: 'edicion'; id: number };

/** One dialog for HU-37 (order), HU-39 (product) and HU-40 (edit). Star picker is a radio group (keyboard + SR friendly). */
export function RatingDialog({
  target,
  title,
  trigger,
  initial,
}: {
  target: Target;
  title: string;
  trigger: React.ReactNode;
  initial?: { puntuacion: number; comentario: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [puntuacion, setPuntuacion] = useState(initial?.puntuacion ?? 0);
  const [comentario, setComentario] = useState(initial?.comentario ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      setErrors({});
      const data = { puntuacion, comentario: comentario || undefined };
      const res =
        target.kind === 'pedido'
          ? await rateOrderAction({ pedidoId: target.pedidoId, ...data })
          : target.kind === 'producto'
            ? await rateProductAction({ productoId: target.productoId, ...data })
            : await updateProductRatingAction({ id: target.id, ...data });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
      } else setErrors(res.fieldErrors ?? { puntuacion: res.error });
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title} className="max-w-md">
        <fieldset className="mb-4">
          <legend className="mb-1.5 text-[12.5px] font-semibold">Tu calificación</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name="puntuacion"
                  value={n}
                  checked={puntuacion === n}
                  onChange={() => setPuntuacion(n)}
                  className="peer sr-only"
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                />
                <Star
                  className={cn(
                    'size-8 transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
                    n <= puntuacion ? 'fill-warning text-warning' : 'text-border hover:text-warning',
                  )}
                  aria-hidden
                />
              </label>
            ))}
          </div>
          {errors.puntuacion && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.puntuacion}
            </p>
          )}
        </fieldset>
        <Field
          label="Comentario (opcional)"
          htmlFor="rating-comentario"
          error={errors.comentario}
          hint={`${comentario.length}/500`}
        >
          <Textarea
            id="rating-comentario"
            value={comentario}
            maxLength={500}
            onChange={(e) => setComentario(e.target.value)}
            aria-describedby="rating-comentario-msg"
          />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button loading={pending} onClick={submit}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRatingButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="soft-danger"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          if (!window.confirm('¿Retirar tu calificación? Dejará de contar en el promedio.')) return;
          const res = await deleteProductRatingAction({ id });
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        })
      }
    >
      Retirar
    </Button>
  );
}
