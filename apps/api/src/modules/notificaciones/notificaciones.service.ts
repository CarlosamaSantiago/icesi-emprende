import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import { notificacion } from '../../database/schema.js';

const LIMIT = 50;

/** HU-42: every query is scoped by the authenticated user, so counters/lists never mix users (CA3). */
@Injectable()
export class NotificacionesService {
  constructor(@InjectDb() private readonly db: Database) {}

  async list(user: AuthUser) {
    const [items, noLeidas] = await Promise.all([
      this.db
        .select({
          id: notificacion.id,
          tipo: notificacion.tipo,
          contenido: notificacion.contenido,
          fecha: notificacion.fecha,
          referenciaId: notificacion.referenciaId,
          leida: notificacion.leida,
        })
        .from(notificacion)
        .where(eq(notificacion.usuarioId, user.id))
        .orderBy(desc(notificacion.fecha), desc(notificacion.id))
        .limit(LIMIT),
      this.contarNoLeidas(user.id),
    ]);
    return { noLeidas, items };
  }

  private async contarNoLeidas(userId: number) {
    return this.db.$count(
      notificacion,
      and(eq(notificacion.usuarioId, userId), eq(notificacion.leida, false)),
    );
  }

  /** Marks one notification as read. Someone else's notification looks like a missing one. */
  async marcarLeida(user: AuthUser, id: number) {
    const done = await this.db
      .update(notificacion)
      .set({ leida: true })
      .where(and(eq(notificacion.id, id), eq(notificacion.usuarioId, user.id)))
      .returning({ id: notificacion.id });
    if (done.length === 0) throw new NotFoundException('Notificación no encontrada');
    return { noLeidas: await this.contarNoLeidas(user.id) };
  }

  async marcarTodasLeidas(user: AuthUser) {
    await this.db
      .update(notificacion)
      .set({ leida: true })
      .where(and(eq(notificacion.usuarioId, user.id), eq(notificacion.leida, false)));
    return { noLeidas: 0 };
  }
}
