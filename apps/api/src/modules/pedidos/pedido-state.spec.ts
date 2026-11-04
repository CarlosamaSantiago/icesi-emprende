import {
  allowedTransitions,
  canTransition,
  deductsStock,
  ESTADOS_PEDIDO,
  restoresStock,
} from './pedido-state.js';

describe('pedido state machine', () => {
  it('follows the happy path', () => {
    expect(canTransition('PENDIENTE', 'CONFIRMADO')).toBe(true);
    expect(canTransition('CONFIRMADO', 'PREPARANDO')).toBe(true);
    expect(canTransition('PREPARANDO', 'ENTREGADO')).toBe(true);
  });

  it('rejects skipping or going backwards', () => {
    expect(canTransition('PENDIENTE', 'ENTREGADO')).toBe(false);
    expect(canTransition('PENDIENTE', 'PREPARANDO')).toBe(false);
    expect(canTransition('PREPARANDO', 'CONFIRMADO')).toBe(false);
    expect(canTransition('CONFIRMADO', 'PENDIENTE')).toBe(false);
  });

  it('allows cancelling any non-final state', () => {
    for (const s of ['PENDIENTE', 'CONFIRMADO', 'PREPARANDO'] as const)
      expect(canTransition(s, 'CANCELADO')).toBe(true);
  });

  it('treats ENTREGADO and CANCELADO as final', () => {
    expect(allowedTransitions('ENTREGADO')).toEqual([]);
    expect(allowedTransitions('CANCELADO')).toEqual([]);
    for (const s of ESTADOS_PEDIDO) expect(canTransition('CANCELADO', s)).toBe(false);
  });

  it('deducts stock only on confirmation', () => {
    expect(deductsStock('PENDIENTE', 'CONFIRMADO')).toBe(true);
    expect(deductsStock('CONFIRMADO', 'PREPARANDO')).toBe(false);
    expect(deductsStock('PENDIENTE', 'CANCELADO')).toBe(false);
  });

  it('restores stock only when it was previously deducted', () => {
    expect(restoresStock('PENDIENTE', 'CANCELADO')).toBe(false);
    expect(restoresStock('CONFIRMADO', 'CANCELADO')).toBe(true);
    expect(restoresStock('PREPARANDO', 'CANCELADO')).toBe(true);
    expect(restoresStock('CANCELADO', 'CANCELADO')).toBe(false); // no double restore
  });
});
