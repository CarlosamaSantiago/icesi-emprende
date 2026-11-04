/**
 * Order state machine (HU-23). Pure functions: no I/O, fully unit-tested.
 *
 *   PENDIENTE → CONFIRMADO → PREPARANDO → ENTREGADO
 *        └──────────┴─────────────┴──→ CANCELADO
 */
export const ESTADOS_PEDIDO = ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'ENTREGADO', 'CANCELADO'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

const TRANSITIONS: Record<EstadoPedido, readonly EstadoPedido[]> = {
  PENDIENTE: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export const allowedTransitions = (from: EstadoPedido): readonly EstadoPedido[] => TRANSITIONS[from] ?? [];
export const canTransition = (from: EstadoPedido, to: EstadoPedido) => allowedTransitions(from).includes(to);

/** Stock is reserved (deducted) when the seller confirms, exactly once. */
export const deductsStock = (from: EstadoPedido, to: EstadoPedido) =>
  from === 'PENDIENTE' && to === 'CONFIRMADO';

/** Stock is given back only if it had been deducted (i.e. cancelling after confirmation). */
export const restoresStock = (from: EstadoPedido, to: EstadoPedido) =>
  to === 'CANCELADO' && (from === 'CONFIRMADO' || from === 'PREPARANDO');
