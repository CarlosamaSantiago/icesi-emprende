import type { Database } from '../../database/database.module.js';
import { notificacion } from '../../database/schema.js';

export type NotificacionTipo = 'PEDIDO' | 'CALIFICACION' | 'APROBACION' | 'RECONOCIMIENTO' | 'PAGO';

/** Works with the Drizzle client and with a transaction, so notifications commit (or roll back) with their cause. */
export async function notificar(
  db: Pick<Database, 'insert'>,
  n: { usuarioId: number; tipo: NotificacionTipo; contenido: string; referenciaId?: number },
) {
  await db.insert(notificacion).values({
    usuarioId: n.usuarioId,
    tipo: n.tipo,
    contenido: n.contenido,
    referenciaId: n.referenciaId,
  });
}
