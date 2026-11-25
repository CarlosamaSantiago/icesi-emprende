import type { LineaPedido } from './metricas.calc.js';
import { esPedidoValido } from '../shared/reglas.js';

/**
 * HU-34 CA3 — compatibility choices:
 *  • UTF-8 with BOM, so Excel shows accents correctly.
 *  • `;` as separator: Excel in Spanish locales (es-CO) treats `,` as the decimal mark and would
 *    otherwise collapse every row into one column. Google Sheets / LibreOffice detect `;` too.
 *  • Amounts are plain numbers with `.` decimals and no thousands separators; ids stay numeric.
 *  • CRLF line endings.
 */
export const CSV_SEPARATOR = ';';

const FORMULA_START = /^[=+\-@\t\r]/;

/** Quotes when needed and neutralizes spreadsheet formula injection in free-text cells. */
export function csvText(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const CSV_HEADERS = [
  'id_pedido',
  'fecha',
  'estado',
  'emprendimiento',
  'comprador',
  'id_producto',
  'producto',
  'cantidad',
  'precio_unitario',
  'subtotal',
  'total_pedido',
  'cuenta_en_ingresos',
] as const;

export function buildCsv(lineas: LineaPedido[]): string {
  const rows = lineas
    .slice()
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime() || a.pedidoId - b.pedidoId)
    .map((l) =>
      [
        l.pedidoId,
        l.fecha.toISOString().slice(0, 19).replace('T', ' '),
        l.estado,
        csvText(l.emprendimiento),
        csvText(l.comprador),
        l.productoId,
        csvText(l.producto),
        l.cantidad,
        l.precioUnitario,
        l.subtotal,
        l.totalPedido,
        esPedidoValido(l.estado, l.pagoEstado) ? 'SI' : 'NO',
      ].join(CSV_SEPARATOR),
    );
  return '﻿' + [CSV_HEADERS.join(CSV_SEPARATOR), ...rows].join('\r\n') + '\r\n';
}
