'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import { requireSession } from '@/lib/auth/session';
import { ratingSchema } from './schemas';

const id = z.number().int().positive();
const body = (d: z.infer<typeof ratingSchema>) => ({
  puntuacion: d.puntuacion,
  comentario: d.comentario ?? '',
});

/** HU-37: rate a delivered order (once). The API checks buyer, state and duplicates. */
export async function rateOrderAction(
  input: { pedidoId: number } & z.infer<typeof ratingSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = ratingSchema.extend({ pedidoId: id }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/pedidos/${parsed.data.pedidoId}/calificacion`, { method: 'POST', body: body(parsed.data) });
    revalidatePath('/mis-compras');
    revalidatePath('/marketplace');
    return ok(undefined, '¡Gracias por calificar!');
  } catch (e) {
    return fromError(e);
  }
}

/** HU-39 */
export async function rateProductAction(
  input: { productoId: number } & z.infer<typeof ratingSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = ratingSchema.extend({ productoId: id }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/productos/${parsed.data.productoId}/calificaciones`, {
      method: 'POST',
      body: body(parsed.data),
    });
    revalidatePath(`/productos/${parsed.data.productoId}`);
    revalidatePath('/mis-calificaciones');
    return ok(undefined, 'Calificación publicada');
  } catch (e) {
    return fromError(e);
  }
}

/** HU-40 */
export async function updateProductRatingAction(
  input: { id: number } & z.infer<typeof ratingSchema>,
): Promise<ActionResult> {
  await requireSession();
  const parsed = ratingSchema.extend({ id }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/calificaciones-producto/${parsed.data.id}`, { method: 'PATCH', body: body(parsed.data) });
    revalidatePath('/productos/[id]', 'page');
    revalidatePath('/mis-calificaciones');
    return ok(undefined, 'Calificación actualizada');
  } catch (e) {
    return fromError(e);
  }
}

export async function deleteProductRatingAction(input: { id: number }): Promise<ActionResult> {
  await requireSession();
  const parsed = z.object({ id }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/calificaciones-producto/${parsed.data.id}`, { method: 'DELETE' });
    revalidatePath('/productos/[id]', 'page');
    revalidatePath('/mis-calificaciones');
    return ok(undefined, 'Calificación retirada');
  } catch (e) {
    return fromError(e);
  }
}
