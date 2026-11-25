import { sql } from 'drizzle-orm';
import { estado, pago } from '../../database/schema.js';
import { ESTADOS_VALIDOS } from './reglas.js';

/**
 * SQL twin of `esPedidoValido` (shared/reglas.ts). Use it in queries that join the ORDER's `estado`
 * (unaliased) and LEFT JOIN `pago`, e.g. `sum(total) filter (where ${pedidoValidoSql})`.
 */
export const pedidoValidoSql = sql`(${estado.nombre} in (${sql.join(
  ESTADOS_VALIDOS.map((e) => sql`${e}`),
  sql`, `,
)}) and (${pago.estado} is null or ${pago.estado} = 'CONFIRMADO'))`;
