/**
 * HU-30 / HU-31: one pure function builds the summary AND the chart data, so graphs always
 * match the numbers (HU-31 CA3). "Valid order" rule: see shared/reglas.ts.
 */
import { ESTADOS_PEDIDO, type EstadoPedido } from '../pedidos/pedido-state.js';
import { esPedidoValido, round } from '../shared/reglas.js';

/** One row per order line (detalle_pedido) joined with its order. */
export interface LineaPedido {
  pedidoId: number;
  fecha: Date;
  estado: EstadoPedido;
  pagoEstado: string | null;
  totalPedido: number;
  comprador: string;
  emprendimiento: string;
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Metricas {
  resumen: {
    totalPedidos: number;
    pedidosValidos: number;
    pedidosPendientes: number;
    pedidosCancelados: number;
    /** Valid-state orders whose payment failed: not revenue (HU-44 CA3). */
    pedidosPagoFallido: number;
    /** Revenue actually committed: sum of valid orders only (HU-30 CA1/CA3). */
    ingresos: number;
    ingresosPendientes: number;
    ingresosCancelados: number;
    unidadesVendidas: number;
    ticketPromedio: number;
  };
  /** HU-31 CA2: all five states, zeros included, in lifecycle order. */
  porEstado: { estado: EstadoPedido; cantidad: number }[];
  /** HU-31 CA1: best sellers by units, with their share of revenue. Valid orders only. */
  productos: {
    productoId: number;
    nombre: string;
    unidades: number;
    ingresos: number;
    participacion: number;
  }[];
  pedidos: {
    id: number;
    fecha: Date;
    estado: EstadoPedido;
    total: number;
    comprador: string;
    emprendimiento: string;
    cuentaEnIngresos: boolean;
  }[];
}

export function computeMetricas(lineas: LineaPedido[]): Metricas {
  // 1. collapse lines into orders
  const orders = new Map<number, Metricas['pedidos'][number] & { pagoEstado: string | null }>();
  for (const l of lineas) {
    if (!orders.has(l.pedidoId)) {
      orders.set(l.pedidoId, {
        id: l.pedidoId,
        fecha: l.fecha,
        estado: l.estado,
        total: l.totalPedido,
        comprador: l.comprador,
        emprendimiento: l.emprendimiento,
        cuentaEnIngresos: esPedidoValido(l.estado, l.pagoEstado),
        pagoEstado: l.pagoEstado,
      });
    }
  }
  const pedidos = [...orders.values()].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  // 2. summary
  const sum = (xs: number[]) => round(xs.reduce((s, x) => s + x, 0));
  const validos = pedidos.filter((p) => p.cuentaEnIngresos);
  const pendientes = pedidos.filter((p) => p.estado === 'PENDIENTE');
  const cancelados = pedidos.filter((p) => p.estado === 'CANCELADO');
  const pagoFallido = pedidos.filter(
    (p) => !p.cuentaEnIngresos && p.estado !== 'PENDIENTE' && p.estado !== 'CANCELADO',
  );
  const ingresos = sum(validos.map((p) => p.total));

  // 3. products (valid orders only)
  const validIds = new Set(validos.map((p) => p.id));
  const byProduct = new Map<
    number,
    { productoId: number; nombre: string; unidades: number; ingresos: number }
  >();
  for (const l of lineas) {
    if (!validIds.has(l.pedidoId)) continue;
    const row = byProduct.get(l.productoId) ?? {
      productoId: l.productoId,
      nombre: l.producto,
      unidades: 0,
      ingresos: 0,
    };
    row.unidades += l.cantidad;
    row.ingresos = round(row.ingresos + l.subtotal);
    byProduct.set(l.productoId, row);
  }
  const productos = [...byProduct.values()]
    .map((p) => ({ ...p, participacion: ingresos > 0 ? round((p.ingresos / ingresos) * 100) : 0 }))
    .sort((a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos || a.nombre.localeCompare(b.nombre));

  return {
    resumen: {
      totalPedidos: pedidos.length,
      pedidosValidos: validos.length,
      pedidosPendientes: pendientes.length,
      pedidosCancelados: cancelados.length,
      pedidosPagoFallido: pagoFallido.length,
      ingresos,
      ingresosPendientes: sum(pendientes.map((p) => p.total)),
      ingresosCancelados: sum(cancelados.map((p) => p.total)),
      unidadesVendidas: productos.reduce((s, p) => s + p.unidades, 0),
      ticketPromedio: validos.length ? round(ingresos / validos.length) : 0,
    },
    porEstado: ESTADOS_PEDIDO.map((estado) => ({
      estado,
      cantidad: pedidos.filter((p) => p.estado === estado).length,
    })),
    productos,
    pedidos: pedidos.map(({ pagoEstado: _omit, ...p }) => p),
  };
}
