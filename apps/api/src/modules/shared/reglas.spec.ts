import { calcularPago, esPedidoValido } from './reglas.js';
import { esFechaValida, mesesEntre, periodoActual, sumarMeses } from './periodo.js';

describe('esPedidoValido', () => {
  it('counts confirmed, preparing and delivered orders', () => {
    for (const e of ['CONFIRMADO', 'PREPARANDO', 'ENTREGADO']) expect(esPedidoValido(e, null)).toBe(true);
  });
  it('never counts pending or cancelled orders (HU-30 CA3)', () => {
    expect(esPedidoValido('PENDIENTE', null)).toBe(false);
    expect(esPedidoValido('CANCELADO', null)).toBe(false);
  });
  it('excludes orders whose payment failed or was refunded (HU-44 CA3)', () => {
    expect(esPedidoValido('ENTREGADO', 'FALLIDO')).toBe(false);
    expect(esPedidoValido('ENTREGADO', 'REEMBOLSADO')).toBe(false);
    expect(esPedidoValido('ENTREGADO', 'CONFIRMADO')).toBe(true);
  });
});

describe('calcularPago (HU-44 CA2)', () => {
  it('charges 10% commission and 2% gateway cost on a confirmed payment', () => {
    expect(calcularPago(228000, 'CONFIRMADO')).toEqual({
      monto: 228000,
      comisionCiei: 22800,
      costoPasarela: 4560,
    });
  });
  it('rounds to cents', () => {
    expect(calcularPago(33.33, 'CONFIRMADO')).toEqual({
      monto: 33.33,
      comisionCiei: 3.33,
      costoPasarela: 0.67,
    });
  });
  it('generates no revenue for failed or refunded payments', () => {
    for (const e of ['FALLIDO', 'REEMBOLSADO'] as const)
      expect(calcularPago(100000, e)).toEqual({ monto: 100000, comisionCiei: 0, costoPasarela: 0 });
  });
});

describe('periodo helpers', () => {
  it('uses Colombia time for the current month', () => {
    // 2026-12-01 03:00 UTC is still 30 Nov 22:00 in Bogotá
    expect(periodoActual(new Date('2026-12-01T03:00:00Z'))).toBe('2026-11');
    expect(periodoActual(new Date('2026-12-01T06:00:00Z'))).toBe('2026-12');
  });
  it('validates real calendar dates', () => {
    expect(esFechaValida('2026-02-28')).toBe(true);
    expect(esFechaValida('2026-02-31')).toBe(false);
    expect(esFechaValida('26-02-01')).toBe(false);
  });
  it('lists months across a year boundary', () => {
    expect(mesesEntre('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(mesesEntre('2026-05', '2026-03')).toEqual([]);
  });
  it('adds months', () => {
    expect(sumarMeses('2026-01', -1)).toBe('2025-12');
    expect(sumarMeses('2026-11', 3)).toBe('2027-02');
  });
});
