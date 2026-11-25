'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ActionResult, fromError, fromZod, ok } from '@/lib/action-result';
import { api } from '@/lib/api/client';
import { requireSession } from '@/lib/auth/session';

export const paymentSchema = z.object({
  pedidoId: z.number().int().positive(),
  estado: z.enum(['CONFIRMADO', 'FALLIDO']),
  referencia: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
});

/** HU-44 CA1: the seller records the outcome of the payment; commission + gateway cost are computed by the API. */
export async function registerPaymentAction(input: z.infer<typeof paymentSchema>): Promise<ActionResult> {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    await api(`/pedidos/${parsed.data.pedidoId}/pago`, {
      method: 'POST',
      body: { estado: parsed.data.estado, referencia: parsed.data.referencia || undefined },
    });
    revalidatePath('/pedidos-recibidos');
    revalidatePath('/mis-compras');
    revalidatePath('/metricas');
    return ok(
      undefined,
      parsed.data.estado === 'CONFIRMADO' ? 'Pago registrado' : 'Pago marcado como fallido',
    );
  } catch (e) {
    return fromError(e);
  }
}
