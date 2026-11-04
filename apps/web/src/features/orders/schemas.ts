import { z } from 'zod';

export const ESTADOS_PEDIDO = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENTREGADO', 'CANCELADO'] as const;

/** Only ids and quantities cross the trust boundary — prices are always taken from the DB by the API. */
export const checkoutSchema = z.object({
  items: z
    .array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(999) }))
    .min(1, 'El carrito está vacío')
    .max(100),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const updateOrderStatusSchema = z.object({
  pedidoId: z.number().int().positive(),
  estado: z.enum(ESTADOS_PEDIDO),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
