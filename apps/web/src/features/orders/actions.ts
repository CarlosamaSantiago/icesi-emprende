'use server';

import { revalidatePath } from 'next/cache';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import type { Pedido } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';
import {
  type CheckoutInput,
  checkoutSchema,
  type UpdateOrderStatusInput,
  updateOrderStatusSchema,
} from './schemas';

/** HU-20: one order per business, created atomically by the API. */
export async function checkoutAction(input: CheckoutInput): Promise<ActionResult<Pedido[]>> {
  await requireSession();
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const pedidos = await api<Pedido[]>('/pedidos/checkout', { method: 'POST', body: parsed.data });
    revalidatePath('/mis-compras');
    return ok(pedidos);
  } catch (e) {
    return fromError(e);
  }
}

/** HU-23: the API validates ownership and the transition; the UI only offers allowed ones. */
export async function updateOrderStatusAction(input: UpdateOrderStatusInput): Promise<ActionResult<Pedido>> {
  await requireSession();
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const pedido = await api<Pedido>(`/pedidos/${parsed.data.pedidoId}/estado`, {
      method: 'PATCH',
      body: { estado: parsed.data.estado },
    });
    revalidatePath('/pedidos-recibidos');
    return ok(pedido, 'Estado actualizado');
  } catch (e) {
    return fromError(e);
  }
}
