import { buildCsv, csvText } from './csv.js';
import { computeMetricas, type LineaPedido } from './metricas.calc.js';

const base = {
  comprador: 'Juan',
  emprendimiento: 'TechStore',
  pagoEstado: null,
} as const;
let n = 0;
const linea = (
  o: Partial<LineaPedido> & Pick<LineaPedido, 'pedidoId' | 'estado' | 'totalPedido'>,
): LineaPedido => ({
  ...base,
  fecha: new Date(`2026-11-${String(10 + (n++ % 10)).padStart(2, '0')}T12:00:00Z`),
  productoId: 1,
  producto: 'Mouse',
  cantidad: 1,
  precioUnitario: o.totalPedido,
  subtotal: o.totalPedido,
  ...o,
});

describe('computeMetricas', () => {
  const lineas = [
    linea({
      pedidoId: 1,
      estado: 'ENTREGADO',
      totalPedido: 100000,
      productoId: 1,
      producto: 'Mouse',
      cantidad: 2,
      subtotal: 100000,
    }),
    linea({
      pedidoId: 2,
      estado: 'CONFIRMADO',
      totalPedido: 60000,
      productoId: 2,
      producto: 'Teclado',
      cantidad: 1,
      subtotal: 60000,
    }),
    linea({
      pedidoId: 3,
      estado: 'PENDIENTE',
      totalPedido: 40000,
      productoId: 1,
      producto: 'Mouse',
      cantidad: 1,
      subtotal: 40000,
    }),
    linea({
      pedidoId: 4,
      estado: 'CANCELADO',
      totalPedido: 500000,
      productoId: 3,
      producto: 'Monitor',
      subtotal: 500000,
    }),
    linea({ pedidoId: 5, estado: 'ENTREGADO', totalPedido: 20000, pagoEstado: 'FALLIDO' }),
  ];
  const m = computeMetricas(lineas);

  it('does not mix total orders with realized revenue (HU-30 CA3)', () => {
    expect(m.resumen.totalPedidos).toBe(5);
    expect(m.resumen.pedidosValidos).toBe(2);
    expect(m.resumen.ingresos).toBe(160000); // not 720000
    expect(m.resumen.pedidosPendientes).toBe(1);
    expect(m.resumen.ingresosPendientes).toBe(40000);
    expect(m.resumen.pedidosCancelados).toBe(1);
    expect(m.resumen.ingresosCancelados).toBe(500000);
    expect(m.resumen.pedidosPagoFallido).toBe(1);
  });

  it('computes units and average ticket from valid orders only', () => {
    expect(m.resumen.unidadesVendidas).toBe(3);
    expect(m.resumen.ticketPromedio).toBe(80000);
  });

  it('ranks products by units with their revenue share (HU-31 CA1)', () => {
    expect(m.productos.map((p) => [p.nombre, p.unidades])).toEqual([
      ['Mouse', 2],
      ['Teclado', 1],
    ]);
    expect(m.productos[0].participacion).toBe(62.5);
    expect(m.productos.reduce((s, p) => s + p.participacion, 0)).toBeCloseTo(100, 5);
  });

  it('charts use the same data as the summary (HU-31 CA2/CA3)', () => {
    expect(m.porEstado.map((e) => e.estado)).toEqual([
      'PENDIENTE',
      'CONFIRMADO',
      'PREPARANDO',
      'ENTREGADO',
      'CANCELADO',
    ]);
    expect(m.porEstado.reduce((s, e) => s + e.cantidad, 0)).toBe(m.resumen.totalPedidos);
    expect(m.porEstado.find((e) => e.estado === 'PREPARANDO')?.cantidad).toBe(0);
  });

  it('counts an order once even with several lines', () => {
    const two = computeMetricas([
      linea({ pedidoId: 9, estado: 'ENTREGADO', totalPedido: 30000, productoId: 1, subtotal: 10000 }),
      linea({
        pedidoId: 9,
        estado: 'ENTREGADO',
        totalPedido: 30000,
        productoId: 2,
        producto: 'Otro',
        subtotal: 20000,
      }),
    ]);
    expect(two.resumen.totalPedidos).toBe(1);
    expect(two.resumen.ingresos).toBe(30000);
    expect(two.productos).toHaveLength(2);
  });

  it('handles an empty period', () => {
    const e = computeMetricas([]);
    expect(e.resumen.ingresos).toBe(0);
    expect(e.resumen.ticketPromedio).toBe(0);
    expect(e.productos).toEqual([]);
  });
});

describe('buildCsv (HU-34)', () => {
  it('starts with BOM + readable headers and uses ; and CRLF', () => {
    const csv = buildCsv([
      linea({
        pedidoId: 7,
        estado: 'ENTREGADO',
        totalPedido: 12500.5,
        productoId: 4,
        producto: 'Café; "especial"',
      }),
    ]);
    expect(csv.startsWith('﻿id_pedido;fecha;estado;')).toBe(true);
    const [, row] = csv.trim().split('\r\n');
    expect(row).toContain('7;');
    expect(row).toContain('"Café; ""especial"""');
    expect(row).toContain(';12500.5;'); // plain number: no currency symbol or thousands separator
    expect(row.endsWith(';SI')).toBe(true);
  });

  it('flags orders that do not count as revenue', () => {
    const csv = buildCsv([linea({ pedidoId: 8, estado: 'CANCELADO', totalPedido: 1 })]);
    expect(csv.trim().split('\r\n')[1].endsWith(';NO')).toBe(true);
  });

  it('neutralizes spreadsheet formula injection', () => {
    expect(csvText('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvText('+57 300')).toBe("'+57 300");
    expect(csvText('Normal')).toBe('Normal');
  });
});
