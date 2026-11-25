/**
 * Business rules shared by metrics, rankings, indicators and payments (sprint 2).
 * Pure module: no I/O. Documented for stakeholders in docs/architecture.md §6.
 */

/** Order states that represent a real, in-progress or completed sale. PENDIENTE (not yet accepted) and CANCELADO never count. */
export const ESTADOS_VALIDOS = ['CONFIRMADO', 'PREPARANDO', 'ENTREGADO'] as const;

/** HU-44 CA2: institutional commission and estimated payment-gateway cost, as a fraction of the order total. */
export const COMISION_CIEI = 0.1;
export const COSTO_PASARELA = 0.02;

export const ESTADOS_PAGO = ['CONFIRMADO', 'FALLIDO', 'REEMBOLSADO'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A "valid order" (counts for revenue, GMV and rankings):
 * its state is CONFIRMADO / PREPARANDO / ENTREGADO **and** it has no failed or refunded payment (HU-30 CA3, HU-44 CA3).
 */
export function esPedidoValido(estado: string, pagoEstado: string | null | undefined): boolean {
  if (!(ESTADOS_VALIDOS as readonly string[]).includes(estado)) return false;
  return !pagoEstado || pagoEstado === 'CONFIRMADO';
}

/** Amounts stored with a payment. Only a CONFIRMADO payment generates commission; others never create phantom revenue. */
export function calcularPago(total: number, estado: EstadoPago) {
  const confirmed = estado === 'CONFIRMADO';
  return {
    monto: round2(total),
    comisionCiei: confirmed ? round2(total * COMISION_CIEI) : 0,
    costoPasarela: confirmed ? round2(total * COSTO_PASARELA) : 0,
  };
}

export const round = round2;
